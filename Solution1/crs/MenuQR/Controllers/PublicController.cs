using MenuQR.Api.Data;
using MenuQR.Api.Extensions;
using MenuQR.Api.Hubs;
using MenuQR.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using static MenuQR.Api.Dtos.PublicDtos;

namespace MenuQR.Api.Controllers;

[ApiController]
[Route("public")]
public class PublicController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IHubContext<OrdersHub> _hub;

    public PublicController(AppDbContext db, IHubContext<OrdersHub> hub)
    {
        _db = db;
        _hub = hub;
    }

    // GET /public/restaurants?search=lavash
    [HttpGet("restaurants")]
    [EnableRateLimiting("public")]
    public async Task<ActionResult<List<PublicRestaurantDto>>> ListRestaurants([FromQuery] string? search)
    {
        var query = _db.Restaurants.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            if (s.Length > 100) s = s[..100];

            // Escape LIKE wildcards so a user typing % _ or [ is searching for those characters
            var pattern = "%" + s.Replace("\\", "\\\\").Replace("%", "\\%")
                                 .Replace("_", "\\_").Replace("[", "\\[") + "%";
            query = query.Where(r => EF.Functions.Like(r.Name, pattern, "\\"));
        }

        var list = await query
            .OrderBy(r => r.Name)
            .Take(50)
            .Select(r => new PublicRestaurantDto
            {
                Name = r.Name,
                Slug = r.Slug,
                Description = r.Description,
                LogoUrl = r.LogoUrl,
                CoverImageUrl = r.CoverImageUrl,
                Address = r.Address,
                Phone = r.Phone
            })
            .ToListAsync();

        return Ok(list);
    }

    // GET /public/restaurants/oq-tepa-lavash  -> restaurant info + full menu
    [HttpGet("restaurants/{slug}")]
    [EnableRateLimiting("public")]
    public async Task<ActionResult<PublicMenuDto>> GetMenu(string slug)
    {
        var key = slug.ToLowerInvariant();

        var restaurant = await _db.Restaurants.AsNoTracking()
            .FirstOrDefaultAsync(r => r.Slug == key);
        if (restaurant is null) return NotFound();

        var categories = await _db.Categories.AsNoTracking()
            .Where(c => c.RestaurantId == restaurant.Id)
            .OrderBy(c => c.SortOrder).ThenBy(c => c.Id)
            .Select(c => new PublicCategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                Items = c.MenuItems
                    .OrderBy(m => m.Id)
                    .Select(m => new PublicMenuItemDto
                    {
                        Id = m.Id,
                        Name = m.Name,
                        Description = m.Description,
                        Price = m.Price,
                        ImageUrl = m.ImageUrl,
                        IsAvailable = m.IsAvailable
                    }).ToList()
            })
            .ToListAsync();

        return Ok(new PublicMenuDto
        {
            Restaurant = new PublicRestaurantDto
            {
                Name = restaurant.Name,
                Slug = restaurant.Slug,
                Description = restaurant.Description,
                LogoUrl = restaurant.LogoUrl,
                CoverImageUrl = restaurant.CoverImageUrl,
                Address = restaurant.Address,
                Phone = restaurant.Phone
            },
            // Hide empty categories from customers
            Categories = categories.Where(c => c.Items.Count > 0).ToList()
        });
    }

    // POST /public/restaurants/oq-tepa-lavash/orders
    [HttpPost("restaurants/{slug}/orders")]
    [EnableRateLimiting("public-order")]
    public async Task<ActionResult<PublicOrderDto>> PlaceOrder(string slug, PlaceOrderRequest req)
    {
        var key = slug.ToLowerInvariant();

        var restaurant = await _db.Restaurants.AsNoTracking()
            .FirstOrDefaultAsync(r => r.Slug == key);
        if (restaurant is null) return NotFound();

        // Load ONLY items that belong to this restaurant. Ids from other restaurants simply won't be found.
        var ids = req.Items.Select(i => i.MenuItemId).Distinct().ToList();
        var menuItems = await _db.MenuItems
            .Where(m => m.RestaurantId == restaurant.Id && ids.Contains(m.Id))
            .ToDictionaryAsync(m => m.Id);

        var order = new Order
        {
            RestaurantId = restaurant.Id,
            CustomerName = req.CustomerName.Trim(),
            TableNumber = req.TableNumber.ToNullIfBlank(),
            Note = req.Note.ToNullIfBlank()
        };

        foreach (var line in req.Items)
        {
            if (!menuItems.TryGetValue(line.MenuItemId, out var menuItem))
                return BadRequest(new { message = "Some items are no longer on the menu. Please refresh the page." });

            if (!menuItem.IsAvailable)
                return BadRequest(new { message = $"\"{menuItem.Name}\" is out of stock." });

            order.Items.Add(new OrderItem
            {
                MenuItem = menuItem,
                Quantity = line.Quantity,
                PriceAtOrderTime = menuItem.Price,   // price always comes from the database
                Note = line.Note.ToNullIfBlank()
            });
        }

        order.TotalPrice = order.Items.Sum(i => i.PriceAtOrderTime * i.Quantity);

        _db.Orders.Add(order);
        await _db.SaveChangesAsync();

        // Push to the restaurant's dashboard instantly
        await _hub.Clients.Group(OrdersHub.RestaurantGroup(restaurant.Id))
            .SendAsync("OrderCreated", order.ToDto());

        return Ok(order.ToPublicDto(restaurant.Name));
    }

    // GET /public/orders/{publicId}  -> lets the customer see the current status
    [HttpGet("orders/{publicId:guid}")]
    [EnableRateLimiting("public")]
    public async Task<ActionResult<PublicOrderDto>> GetOrder(Guid publicId)
    {
        var order = await _db.Orders.AsNoTracking()
            .Include(o => o.Restaurant)
            .Include(o => o.Items).ThenInclude(i => i.MenuItem)
            .FirstOrDefaultAsync(o => o.PublicId == publicId);

        return order is null ? NotFound() : Ok(order.ToPublicDto(order.Restaurant.Name));
    }
}
