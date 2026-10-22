using MenuQR.Api.Models;
using System.ComponentModel.DataAnnotations;

namespace MenuQR.Api.Dtos;

public class PublicDtos
{
    public class PublicRestaurantDto
    {
        public string Name { get; set; } = null!;
        public string Slug { get; set; } = null!;
        public string? Description { get; set; }
        public string? LogoUrl { get; set; }
        public string? CoverImageUrl { get; set; }
        public string? Address { get; set; }
        public string? Phone { get; set; }
    }

    public class PublicMenuItemDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public string? ImageUrl { get; set; }
        public bool IsAvailable { get; set; }
    }

    public class PublicCategoryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public List<PublicMenuItemDto> Items { get; set; } = new();
    }

    public class PublicMenuDto
    {
        public PublicRestaurantDto Restaurant { get; set; } = null!;
        public List<PublicCategoryDto> Categories { get; set; } = new();
    }

    // ----- Placing an order -----
    public class PlaceOrderItem
    {
        [Range(1, int.MaxValue)]
        public int MenuItemId { get; set; }

        [Range(1, 99)]
        public int Quantity { get; set; }

        [StringLength(300)]
        public string? Note { get; set; }
    }

    public class PlaceOrderRequest
    {
        [Required, StringLength(60, MinimumLength = 1)]
        public string CustomerName { get; set; } = null!;

        // Letters, numbers, spaces and dashes only, e.g. "5" or "VIP-2"
        [RegularExpression(@"^[\p{L}\p{N}\s\-]{1,20}$", ErrorMessage = "Invalid table number.")]
        public string? TableNumber { get; set; }

        [StringLength(500)]
        public string? Note { get; set; }

        [Required, MinLength(1), MaxLength(50)]
        public List<PlaceOrderItem> Items { get; set; } = new();
    }

    // ----- Order tracking -----
    public class PublicOrderItemDto
    {
        public string Name { get; set; } = null!;
        public int Quantity { get; set; }
        public decimal Price { get; set; }
        public string? Note { get; set; }
    }

    public class PublicOrderDto
    {
        public Guid PublicId { get; set; }
        public string RestaurantName { get; set; } = null!;
        public string CustomerName { get; set; } = null!;
        public string? TableNumber { get; set; }
        public OrderStatus Status { get; set; }
        public decimal TotalPrice { get; set; }
        public string? Note { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<PublicOrderItemDto> Items { get; set; } = new();
    }
}
