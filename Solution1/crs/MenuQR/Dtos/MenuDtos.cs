using System.ComponentModel.DataAnnotations;

namespace MenuQR.Api.Dtos;

// ----- Categories -----
public class CategoryRequest
{
    [Required, StringLength(100, MinimumLength = 1)]
    public string Name { get; set; } = null!;

    // Optional. If empty, the category goes to the end of the list.
    public int? SortOrder { get; set; }
}

public class CategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public int SortOrder { get; set; }
    public int ItemCount { get; set; }
}

// ----- Menu items -----
public class MenuItemRequest
{
    [Required]
    public int CategoryId { get; set; }

    [Required, StringLength(150, MinimumLength = 1)]
    public string Name { get; set; } = null!;

    [StringLength(1000)]
    public string? Description { get; set; }

    [Range(0, 1_000_000_000)]
    public decimal Price { get; set; }

    [StringLength(500)]
    public string? ImageUrl { get; set; }

    public bool IsAvailable { get; set; } = true;
}

public class SetAvailabilityRequest
{
    public bool IsAvailable { get; set; }
}

public class MenuItemDto
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsAvailable { get; set; }
}
