using MenuQR.Api.Data;
using MenuQR.Api.Dtos;
using MenuQR.Api.Extensions;
using MenuQR.Api.Models;
using MenuQR.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MenuQR.Api.Controllers
{
    [ApiController]
    [Route("menu-items")]
    [Authorize]
    public class MenuItemsController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IImageService _images;

        public MenuItemsController(AppDbContext db, IImageService images)
        {
            _db = db;
            _images = images;
        }

        // GET /menu-items            -> all items
        // GET /menu-items?categoryId=3 -> only that category
        [HttpGet]
        public async Task<ActionResult<List<MenuItemDto>>> GetAll([FromQuery] int? categoryId)
        {
            var rid = User.GetRestaurantId();

            var query = _db.MenuItems.Where(m => m.RestaurantId == rid);
            if (categoryId is not null) query = query.Where(m => m.CategoryId == categoryId);

            var items = await query
                .OrderBy(m => m.Category.SortOrder).ThenBy(m => m.Id)
                .Select(m => new MenuItemDto
                {
                    Id = m.Id,
                    CategoryId = m.CategoryId,
                    CategoryName = m.Category.Name,
                    Name = m.Name,
                    Description = m.Description,
                    Price = m.Price,
                    ImageUrl = m.ImageUrl,
                    IsAvailable = m.IsAvailable
                })
                .ToListAsync();

            return Ok(items);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<MenuItemDto>> GetOne(int id)
        {
            var rid = User.GetRestaurantId();
            var item = await _db.MenuItems.Include(m => m.Category)
                .FirstOrDefaultAsync(m => m.Id == id && m.RestaurantId == rid);

            return item is null ? NotFound() : Ok(ToDto(item));
        }

        [HttpPost]
        public async Task<ActionResult<MenuItemDto>> Create(MenuItemRequest req)
        {
            var rid = User.GetRestaurantId();

            var (category, error) = await ValidateAsync(req, rid);
            if (category is null) return BadRequest(new { message = error });

            var item = new MenuItem { RestaurantId = rid };
            Apply(item, req, category);

            _db.MenuItems.Add(item);
            await _db.SaveChangesAsync();

            return Ok(ToDto(item));
        }

        [HttpPut("{id:int}")]
        public async Task<ActionResult<MenuItemDto>> Update(int id, MenuItemRequest req)
        {
            var rid = User.GetRestaurantId();

            var item = await _db.MenuItems.Include(m => m.Category)
                .FirstOrDefaultAsync(m => m.Id == id && m.RestaurantId == rid);
            if (item is null) return NotFound();

            var (category, error) = await ValidateAsync(req, rid);
            if (category is null) return BadRequest(new { message = error });

            Apply(item, req, category);
            await _db.SaveChangesAsync();

            return Ok(ToDto(item));
        }

        // Quick "in stock / out of stock" switch
        [HttpPatch("{id:int}/availability")]
        public async Task<ActionResult<MenuItemDto>> SetAvailability(int id, SetAvailabilityRequest req)
        {
            var rid = User.GetRestaurantId();

            var item = await _db.MenuItems.Include(m => m.Category)
                .FirstOrDefaultAsync(m => m.Id == id && m.RestaurantId == rid);
            if (item is null) return NotFound();

            item.IsAvailable = req.IsAvailable;
            await _db.SaveChangesAsync();

            return Ok(ToDto(item));
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var rid = User.GetRestaurantId();

            var item = await _db.MenuItems.FirstOrDefaultAsync(m => m.Id == id && m.RestaurantId == rid);
            if (item is null) return NotFound();

            if (await _db.OrderItems.AnyAsync(oi => oi.MenuItemId == id))
                return Conflict(new { message = "This item appears in past orders, so it can't be deleted. Mark it as unavailable instead." });

            _db.MenuItems.Remove(item);
            await _db.SaveChangesAsync();
            return NoContent();
        }

        // The category must belong to THIS restaurant, otherwise someone could
        // attach their items to another restaurant's category.
        private async Task<(Category? category, string? error)> ValidateAsync(MenuItemRequest req, int restaurantId)
        {
            if (!_images.IsOurImageUrl(req.ImageUrl))
                return (null, "Images must be uploaded through the app.");

            var category = await _db.Categories
                .FirstOrDefaultAsync(c => c.Id == req.CategoryId && c.RestaurantId == restaurantId);

            return category is null ? (null, "Category not found.") : (category, null);
        }

        private static void Apply(MenuItem item, MenuItemRequest req, Category category)
        {
            item.CategoryId = category.Id;
            item.Category = category;
            item.Name = req.Name.Trim();
            item.Description = req.Description.ToNullIfBlank();
            item.Price = Math.Round(req.Price, 2);
            item.ImageUrl = req.ImageUrl.ToNullIfBlank();
            item.IsAvailable = req.IsAvailable;
        }

        private static MenuItemDto ToDto(MenuItem m) => new()
        {
            Id = m.Id,
            CategoryId = m.CategoryId,
            CategoryName = m.Category.Name,
            Name = m.Name,
            Description = m.Description,
            Price = m.Price,
            ImageUrl = m.ImageUrl,
            IsAvailable = m.IsAvailable
        };
    }
}
