using MenuQR.Api.Data;
using MenuQR.Api.Extensions;
using MenuQR.Api.Hubs;
using MenuQR.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using static MenuQR.Api.Dtos.OrderDtos;

namespace MenuQR.Api.Controllers;

[ApiController]
[Route("orders")]
[Authorize]
public class OrdersController : ControllerBase
{
    // Which status can follow which: New -> Preparing -> Ready -> Served, and Cancelled while not finished
    private static readonly Dictionary<OrderStatus, OrderStatus[]> Transitions = new()
    {
        [OrderStatus.New] = new[] { OrderStatus.Preparing, OrderStatus.Cancelled },
        [OrderStatus.Preparing] = new[] { OrderStatus.Ready, OrderStatus.Cancelled },
        [OrderStatus.Ready] = new[] { OrderStatus.Served, OrderStatus.Cancelled },
        [OrderStatus.Served] = Array.Empty<OrderStatus>(),
        [OrderStatus.Cancelled] = Array.Empty<OrderStatus>()
    };

    private readonly AppDbContext _db;
    private readonly IHubContext<OrdersHub> _hub;

    public OrdersController(AppDbContext db, IHubContext<OrdersHub> hub)
    {
        _db = db;
        _hub = hub;
    }

    // GET /orders?active=true            -> live orders (New, Preparing, Ready), oldest first
    // GET /orders?page=1&pageSize=20     -> full history, newest first
    // GET /orders?status=Served          -> filter by one status
    [HttpGet]
    public async Task<ActionResult<PagedResult<OrderDto>>> GetAll(
        [FromQuery] OrderStatus? status,
        [FromQuery] bool? active,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var rid = User.GetRestaurantId();
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.Orders.AsNoTracking().Where(o => o.RestaurantId == rid);

        if (status is not null)
            query = query.Where(o => o.Status == status);

        if (active == true)
            query = query.Where(o => o.Status == OrderStatus.New ||
                                     o.Status == OrderStatus.Preparing ||
                                     o.Status == OrderStatus.Ready);

        var total = await query.CountAsync();

        query = active == true
            ? query.OrderBy(o => o.CreatedAt)
            : query.OrderByDescending(o => o.CreatedAt);

        var orders = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(o => o.Items).ThenInclude(i => i.MenuItem)
            .ToListAsync();

        return Ok(new PagedResult<OrderDto>
        {
            Items = orders.Select(o => o.ToDto()).ToList(),
            Total = total,
            Page = page,
            PageSize = pageSize
        });
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<OrderDto>> GetOne(int id)
    {
        var rid = User.GetRestaurantId();

        var order = await _db.Orders.AsNoTracking()
            .Include(o => o.Items).ThenInclude(i => i.MenuItem)
            .FirstOrDefaultAsync(o => o.Id == id && o.RestaurantId == rid);

        return order is null ? NotFound() : Ok(order.ToDto());
    }

    [HttpPatch("{id:int}/status")]
    public async Task<ActionResult<OrderDto>> UpdateStatus(int id, UpdateOrderStatusRequest req)
    {
        var rid = User.GetRestaurantId();
        var newStatus = req.Status!.Value;

        if (!Enum.IsDefined(newStatus))
            return BadRequest(new { message = "Unknown status." });

        var order = await _db.Orders
            .Include(o => o.Items).ThenInclude(i => i.MenuItem)
            .FirstOrDefaultAsync(o => o.Id == id && o.RestaurantId == rid);
        if (order is null) return NotFound();

        if (order.Status == newStatus)
            return Ok(order.ToDto());

        if (!Transitions[order.Status].Contains(newStatus))
            return Conflict(new { message = $"An order that is {order.Status} cannot be changed to {newStatus}." });

        order.Status = newStatus;
        await _db.SaveChangesAsync();

        var dto = order.ToDto();

        // Update every open dashboard of this restaurant...
        await _hub.Clients.Group(OrdersHub.RestaurantGroup(rid)).SendAsync("OrderUpdated", dto);
        // ...and the customer who is watching this order
        await _hub.Clients.Group(OrdersHub.OrderGroup(order.PublicId))
            .SendAsync("OrderStatusChanged", new { publicId = order.PublicId, status = order.Status });

        return Ok(dto);
    }
}