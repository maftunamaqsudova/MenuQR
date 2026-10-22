using MenuQR.Api.Data;
using MenuQR.Api.Dtos;
using MenuQR.Api.Extensions;
using MenuQR.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MenuQR.Api.Controllers;

[ApiController]
[Route("categories")]
[Authorize]
public class CategoriesController : ControllerBase
{
    private readonly AppDbContext _db;
    public CategoriesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<CategoryDto>>> GetAll()
    {
        var rid = User.GetRestaurantId();

        var list = await _db.Categories
            .Where(c => c.RestaurantId == rid)
            .OrderBy(c => c.SortOrder).ThenBy(c => c.Id)
            .Select(c => new CategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                SortOrder = c.SortOrder,
                ItemCount = c.MenuItems.Count
            })
            .ToListAsync();

        return Ok(list);
    }

    [HttpPost]
    public async Task<ActionResult<CategoryDto>> Create(CategoryRequest req)
    {
        var rid = User.GetRestaurantId();
        var name = req.Name.Trim();

        if (await _db.Categories.AnyAsync(c => c.RestaurantId == rid && c.Name.ToLower() == name.ToLower()))
            return Conflict(new { message = "A category with this name already exists." });

        var sortOrder = req.SortOrder ??
            ((await _db.Categories.Where(c => c.RestaurantId == rid).MaxAsync(c => (int?)c.SortOrder)) ?? 0) + 1;

        var category = new Category { RestaurantId = rid, Name = name, SortOrder = sortOrder };
        _db.Categories.Add(category);
        await _db.SaveChangesAsync();

        return Ok(new CategoryDto { Id = category.Id, Name = category.Name, SortOrder = category.SortOrder, ItemCount = 0 });
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<CategoryDto>> Update(int id, CategoryRequest req)
    {
        var rid = User.GetRestaurantId();

        var category = await _db.Categories.FirstOrDefaultAsync(c => c.Id == id && c.RestaurantId == rid);
        if (category is null) return NotFound();

        var name = req.Name.Trim();
        if (await _db.Categories.AnyAsync(c => c.RestaurantId == rid && c.Id != id && c.Name.ToLower() == name.ToLower()))
            return Conflict(new { message = "A category with this name already exists." });

        category.Name = name;
        if (req.SortOrder is not null) category.SortOrder = req.SortOrder.Value;

        await _db.SaveChangesAsync();

        var count = await _db.MenuItems.CountAsync(m => m.CategoryId == id);
        return Ok(new CategoryDto { Id = category.Id, Name = category.Name, SortOrder = category.SortOrder, ItemCount = count });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var rid = User.GetRestaurantId();

        var category = await _db.Categories.FirstOrDefaultAsync(c => c.Id == id && c.RestaurantId == rid);
        if (category is null) return NotFound();

        // Deleting a category also deletes its items, but we must keep order history intact
        var hasOrders = await _db.OrderItems.AnyAsync(oi => oi.MenuItem.CategoryId == id);
        if (hasOrders)
            return Conflict(new { message = "Items in this category appear in past orders, so it can't be deleted. Mark its items as unavailable instead." });

        _db.Categories.Remove(category);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
