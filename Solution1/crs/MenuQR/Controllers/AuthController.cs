using MenuQR.Api.Data;
using MenuQR.Api.Dtos;
using MenuQR.Api.Extensions;
using MenuQR.Api.Models;
using MenuQR.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using LoginRequest = MenuQR.Api.Dtos.LoginRequest;
using RegisterRequest = MenuQR.Api.Dtos.RegisterRequest;

namespace MenuQR.Api.Controllers;

[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ITokenService _tokens;
    private readonly ISlugService _slugs;

    public AuthController(AppDbContext db, ITokenService tokens, ISlugService slugs)
    {
        _db = db;
        _tokens = tokens;
        _slugs = slugs;
    }

    [HttpPost("register")]
    [EnableRateLimiting("auth")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest req)
    {
        var email = req.Email.Trim().ToLowerInvariant();

        if (await _db.Users.AnyAsync(u => u.Email == email))
            return Conflict(new { message = "This email is already registered." });

        var user = new User
        {
            Name = req.Name.Trim(),
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password)
        };

        var restaurant = new Restaurant
        {
            Owner = user,
            Name = req.RestaurantName.Trim(),
            Slug = await _slugs.GenerateUniqueAsync(req.RestaurantName)
        };

        _db.Restaurants.Add(restaurant); // also saves the user, in one transaction

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            // Two people registered the same email/slug at the exact same moment
            return Conflict(new { message = "Email or restaurant address is already taken. Please try again." });
        }

        return Ok(BuildResponse(user, restaurant));
    }

    [HttpPost("login")]
    [EnableRateLimiting("auth")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest req)
    {
        var email = req.Email.Trim().ToLowerInvariant();

        var user = await _db.Users
            .Include(u => u.Restaurant)
            .FirstOrDefaultAsync(u => u.Email == email);

        // Same message for "no such user" and "wrong password" so attackers can't tell which emails exist
        if (user is null || user.Restaurant is null ||
            !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            return Unauthorized(new { message = "Invalid email or password." });

        return Ok(BuildResponse(user, user.Restaurant));
    }

    // Lets the frontend check "who am I?" with a saved token
    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<AuthResponse>> Me()
    {
        var userId = User.GetUserId();

        var user = await _db.Users
            .Include(u => u.Restaurant)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user?.Restaurant is null) return Unauthorized();

        return Ok(BuildResponse(user, user.Restaurant));
    }

    private AuthResponse BuildResponse(User user, Restaurant restaurant) => new()
    {
        Token = _tokens.CreateToken(user, restaurant),
        UserId = user.Id,
        Name = user.Name,
        Email = user.Email,
        RestaurantId = restaurant.Id,
        RestaurantName = restaurant.Name,
        RestaurantSlug = restaurant.Slug
    };
}
