using System.ComponentModel.DataAnnotations;

namespace MenuQR.Api.Dtos;

public class RegisterRequest
{
    [Required, StringLength(100, MinimumLength = 2)]
    public string Name { get; set; } = null!;

    [Required, EmailAddress, StringLength(255)]
    public string Email { get; set; } = null!;

    [Required, StringLength(100, MinimumLength = 8)]
    public string Password { get; set; } = null!;

    [Required, StringLength(150, MinimumLength = 2)]
    public string RestaurantName { get; set; } = null!;
}

public class LoginRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = null!;

    [Required]
    public string Password { get; set; } = null!;
}

public class AuthResponse
{
    public string Token { get; set; } = null!;
    public int UserId { get; set; }
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;
    public int RestaurantId { get; set; }
    public string RestaurantName { get; set; } = null!;
    public string RestaurantSlug { get; set; } = null!;
}
