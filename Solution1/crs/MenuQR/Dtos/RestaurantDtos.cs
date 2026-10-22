using System.ComponentModel.DataAnnotations;

namespace MenuQR.Api.Dtos;

public class RestaurantDtos
{
    public class UpdateRestaurantRequest
    {
        [Required, StringLength(150, MinimumLength = 2)]
        public string Name { get; set; } = null!;

        [StringLength(1000)]
        public string? Description { get; set; }

        [StringLength(500)]
        public string? LogoUrl { get; set; }

        [StringLength(500)]
        public string? CoverImageUrl { get; set; }

        [StringLength(300)]
        public string? Address { get; set; }

        [RegularExpression(@"^[+0-9\s\-()]{5,30}$", ErrorMessage = "Invalid phone number.")]
        public string? Phone { get; set; }
    }

    public class RestaurantDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string Slug { get; set; } = null!;
        public string? Description { get; set; }
        public string? LogoUrl { get; set; }
        public string? CoverImageUrl { get; set; }
        public string? Address { get; set; }
        public string? Phone { get; set; }
    }
}
