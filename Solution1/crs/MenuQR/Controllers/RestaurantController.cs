using Microsoft.EntityFrameworkCore;
using MenuQR.Api.Data;
using MenuQR.Api.Extensions;
using MenuQR.Api.Models;
using MenuQR.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using static MenuQR.Api.Dtos.RestaurantDtos;

namespace MenuQR.Api.Controllers;

    [ApiController]
    [Route("restaurant")]
    [Authorize]
    public class RestaurantController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IImageService _images;

        public RestaurantController(AppDbContext db, IImageService images)
        {
            _db = db;
            _images = images;
        }

        [HttpGet("me")]
        public async Task<ActionResult<RestaurantDto>> GetMine()
        {
            var restaurant = await _db.Restaurants.FindAsync(User.GetRestaurantId());
            if (restaurant is null) return NotFound();
            return Ok(ToDto(restaurant));
        }

        [HttpPut("me")]
        public async Task<ActionResult<RestaurantDto>> UpdateMine(UpdateRestaurantRequest req)
        {
            if (!_images.IsOurImageUrl(req.LogoUrl) || !_images.IsOurImageUrl(req.CoverImageUrl))
                return BadRequest(new { message = "Images must be uploaded through the app." });

            var restaurant = await _db.Restaurants.FindAsync(User.GetRestaurantId());
            if (restaurant is null) return NotFound();

            // The slug is NOT changed here on purpose, so printed QR codes never break.
            restaurant.Name = req.Name.Trim();
            restaurant.Description = req.Description.ToNullIfBlank();
            restaurant.LogoUrl = req.LogoUrl.ToNullIfBlank();
            restaurant.CoverImageUrl = req.CoverImageUrl.ToNullIfBlank();
            restaurant.Address = req.Address.ToNullIfBlank();
            restaurant.Phone = req.Phone.ToNullIfBlank();

            await _db.SaveChangesAsync();
            return Ok(ToDto(restaurant));
        }

        private static RestaurantDto ToDto(Restaurant r) => new()
        {
            Id = r.Id,
            Name = r.Name,
            Slug = r.Slug,
            Description = r.Description,
            LogoUrl = r.LogoUrl,
            CoverImageUrl = r.CoverImageUrl,
            Address = r.Address,
            Phone = r.Phone
        };
    }

