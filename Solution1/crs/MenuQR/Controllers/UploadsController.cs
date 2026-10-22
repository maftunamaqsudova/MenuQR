using MenuQR.Api.Extensions;
using MenuQR.Api.Models;
using MenuQR.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace MenuQR.Api.Controllers;

[ApiController]
[Route("uploads")]
[Authorize]
public class UploadsController : ControllerBase
{
    private readonly IImageService _images;
    public UploadsController(IImageService images) => _images = images;

    [HttpPost("image")]
    [EnableRateLimiting("upload")]
    [RequestSizeLimit(6 * 1024 * 1024)]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadImage(IFormFile file)
    {
        try
        {
            var url = await _images.UploadAsync(file, $"restaurant-{User.GetRestaurantId()}");
            return Ok(new { url });
        }
        catch (ImageUploadException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
