namespace MenuQR.Api.Models;

public class Restaurant
{
    public int Id { get; set; }
    public int OwnerId { get; set; }
    public User Owner { get; set; } = null!;

    public string Name { get; set; } = null!;
    public string Slug { get; set; } = null!;
    public string? Description { get; set; }
    public string? LogoUrl { get; set; }
    public string? CoverImageUrl { get; set; }
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<Category> Categories { get; set; } = new();
    public List<MenuItem> MenuItems { get; set; } = new();
    public List<Order> Orders { get; set; } = new();
}
