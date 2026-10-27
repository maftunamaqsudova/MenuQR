using MenuQR.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace MenuQR.Api.Data;
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Restaurant> Restaurants => Set<Restaurant>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<MenuItem> MenuItems => Set<MenuItem>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<User>(e =>
        {
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Email).HasMaxLength(255);
            e.Property(u => u.Name).HasMaxLength(100);
        });

        b.Entity<Restaurant>(e =>
        {
            e.HasIndex(r => r.Slug).IsUnique();
            e.Property(r => r.Name).HasMaxLength(150);
            e.Property(r => r.Slug).HasMaxLength(180);

            // One owner = exactly one restaurant
            e.HasOne(r => r.Owner)
             .WithOne(u => u.Restaurant)
             .HasForeignKey<Restaurant>(r => r.OwnerId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Category>(e =>
        {
            e.Property(c => c.Name).HasMaxLength(100);
            e.HasOne(c => c.Restaurant)
             .WithMany(r => r.Categories)
             .HasForeignKey(c => c.RestaurantId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<MenuItem>(e =>
        {
            e.Property(m => m.Name).HasMaxLength(150);
            e.Property(m => m.Price).HasPrecision(12, 2);
            e.HasOne(m => m.Restaurant)
             .WithMany(r => r.MenuItems)
             .HasForeignKey(m => m.RestaurantId)
             .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(m => m.Category)
             .WithMany(c => c.MenuItems)
             .HasForeignKey(m => m.CategoryId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Order>(e =>
        {
            e.Property(o => o.TotalPrice).HasPrecision(12, 2);
            e.Property(o => o.Status).HasConversion<string>().HasMaxLength(20);
            e.HasIndex(o => new { o.RestaurantId, o.CreatedAt });
            e.HasIndex(o => o.PublicId).IsUnique();
            e.HasOne(o => o.Restaurant)
             .WithMany(r => r.Orders)
             .HasForeignKey(o => o.RestaurantId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<OrderItem>(e =>
        {
            e.Property(i => i.PriceAtOrderTime).HasPrecision(12, 2);
            e.HasOne(i => i.Order)
             .WithMany(o => o.Items)
             .HasForeignKey(i => i.OrderId)
             .OnDelete(DeleteBehavior.Cascade);
            // Keep order history even if a menu item is deleted later
            e.HasOne(i => i.MenuItem)
             .WithMany()
             .HasForeignKey(i => i.MenuItemId)
             .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
