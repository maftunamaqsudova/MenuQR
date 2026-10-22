using MenuQR.Api.Data;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

namespace MenuQR.Api.Hubs;

public class OrdersHub : Hub
{
    private readonly AppDbContext _db;
    public OrdersHub(AppDbContext db) => _db = db;

    public static string RestaurantGroup(int restaurantId) => $"restaurant-{restaurantId}";
    public static string OrderGroup(Guid publicId) => $"order-{publicId}";

    // A logged-in admin automatically joins THEIR restaurant's group (taken from the token),
    // so they only ever receive their own orders.
    public override async Task OnConnectedAsync()
    {
        var claim = Context.User?.FindFirst("restaurantId")?.Value;
        if (Context.User?.Identity?.IsAuthenticated == true && int.TryParse(claim, out var rid))
            await Groups.AddToGroupAsync(Context.ConnectionId, RestaurantGroup(rid));

        await base.OnConnectedAsync();
    }

    // A customer (no login) joins the group of their own order, using the secret PublicId
    public async Task<bool> JoinOrder(Guid publicId)
    {
        if (!await _db.Orders.AnyAsync(o => o.PublicId == publicId))
            return false;

        await Groups.AddToGroupAsync(Context.ConnectionId, OrderGroup(publicId));
        return true;
    }
}
