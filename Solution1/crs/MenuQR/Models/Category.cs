namespace MenuQR.Api.Models;

public class Category
{
    public int Id { get; set; }
    public int RestaurantId { get; set; }
    public Restaurant Restaurant { get; set; } = null!;

    public string Name { get; set; } = null!;
    public int SortOrder { get; set; }

    public List<MenuItem> MenuItems { get; set; } = new();
}
