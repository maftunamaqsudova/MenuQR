using MenuQR.Api.Models;
using static MenuQR.Api.Dtos.OrderDtos;
using static MenuQR.Api.Dtos.PublicDtos;

namespace MenuQR.Api.Extensions;

public static class OrderMapping
{
    // Requires o.Items and each item's MenuItem to be loaded
    public static OrderDto ToDto(this Order o) => new()
    {
        Id = o.Id,
        PublicId = o.PublicId,
        CustomerName = o.CustomerName,
        TableNumber = o.TableNumber,
        Status = o.Status,
        TotalPrice = o.TotalPrice,
        Note = o.Note,
        CreatedAt = o.CreatedAt,
        Items = o.Items.OrderBy(i => i.Id).Select(i => new OrderItemDto
        {
            Id = i.Id,
            MenuItemId = i.MenuItemId,
            Name = i.MenuItem.Name,
            Quantity = i.Quantity,
            PriceAtOrderTime = i.PriceAtOrderTime,
            Note = i.Note
        }).ToList()
    };

    public static PublicOrderDto ToPublicDto(this Order o, string restaurantName) => new()
    {
        PublicId = o.PublicId,
        RestaurantName = restaurantName,
        CustomerName = o.CustomerName,
        TableNumber = o.TableNumber,
        Status = o.Status,
        TotalPrice = o.TotalPrice,
        Note = o.Note,
        CreatedAt = o.CreatedAt,
        Items = o.Items.OrderBy(i => i.Id).Select(i => new PublicOrderItemDto
        {
            Name = i.MenuItem.Name,
            Quantity = i.Quantity,
            Price = i.PriceAtOrderTime,
            Note = i.Note
        }).ToList()
    };
}
