namespace MenuQR.Api.Models;

public class Order
{
    public int Id { get; set; }

    // Random id shown to the customer for tracking (the numeric Id stays private to the admin)
    public Guid PublicId { get; set; } = Guid.NewGuid();

    public int RestaurantId { get; set; }
    public Restaurant Restaurant { get; set; } = null!;

    public string CustomerName { get; set; } = null!;
    public string? TableNumber { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.New;
    public decimal TotalPrice { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<OrderItem> Items { get; set; } = new();
}
