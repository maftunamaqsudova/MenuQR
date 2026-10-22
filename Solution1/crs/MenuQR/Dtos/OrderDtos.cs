using MenuQR.Api.Models;
using System.ComponentModel.DataAnnotations;

namespace MenuQR.Api.Dtos;

public class OrderDtos
{
    public class OrderItemDto
    {
        public int Id { get; set; }
        public int MenuItemId { get; set; }
        public string Name { get; set; } = null!;
        public int Quantity { get; set; }
        public decimal PriceAtOrderTime { get; set; }
        public string? Note { get; set; }
    }

    public class OrderDto
    {
        public int Id { get; set; }
        public Guid PublicId { get; set; }
        public string CustomerName { get; set; } = null!;
        public string? TableNumber { get; set; }
        public OrderStatus Status { get; set; }
        public decimal TotalPrice { get; set; }
        public string? Note { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<OrderItemDto> Items { get; set; } = new();
    }

    public class UpdateOrderStatusRequest
    {
        [Required]
        public OrderStatus? Status { get; set; }
    }

    public class PagedResult<T>
    {
        public List<T> Items { get; set; } = new();
        public int Total { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
    }
}
