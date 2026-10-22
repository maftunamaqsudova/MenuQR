using System.Security.Claims;

namespace MenuQR.Api.Extensions;

public static class ClaimsExtensions
{
    public static int GetUserId(this ClaimsPrincipal user) =>
        int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);

    public static int GetRestaurantId(this ClaimsPrincipal user) =>
        int.Parse(user.FindFirstValue("restaurantId")!);
}
