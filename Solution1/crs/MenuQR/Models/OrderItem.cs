namespace MenuQR.Api.Models;

public class OrderItem
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public Order Order { get; set; } = null!;
    public int MenuItemId { get; set; }
    public MenuItem MenuItem { get; set; } = null!;

    public int Quantity { get; set; }
    public decimal PriceAtOrderTime { get; set; }
    public string? Note { get; set; }
}
