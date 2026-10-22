namespace MenuQR.Api.Models;

public class MenuItem
{
    public int Id { get; set; }
    public int RestaurantId { get; set; }
    public Restaurant Restaurant { get; set; } = null!;
    public int CategoryId { get; set; }
    public Category Category { get; set; } = null!;

    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsAvailable { get; set; } = true;
}
