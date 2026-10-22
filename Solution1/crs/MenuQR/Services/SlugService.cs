using MenuQR.Api.Data;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace MenuQR.Api.Services;


public interface ISlugService
{
    Task<string> GenerateUniqueAsync(string name);
}
public class SlugService : ISlugService
{
    private readonly AppDbContext _db;
    public SlugService(AppDbContext db) => _db = db;

    // Cyrillic (Russian + Uzbek) -> Latin
    private static readonly Dictionary<char, string> Map = new()
    {
        ['а'] = "a",
        ['б'] = "b",
        ['в'] = "v",
        ['г'] = "g",
        ['д'] = "d",
        ['е'] = "e",
        ['ё'] = "e",
        ['ж'] = "j",
        ['з'] = "z",
        ['и'] = "i",
        ['й'] = "y",
        ['к'] = "k",
        ['л'] = "l",
        ['м'] = "m",
        ['н'] = "n",
        ['о'] = "o",
        ['п'] = "p",
        ['р'] = "r",
        ['с'] = "s",
        ['т'] = "t",
        ['у'] = "u",
        ['ф'] = "f",
        ['х'] = "x",
        ['ц'] = "ts",
        ['ч'] = "ch",
        ['ш'] = "sh",
        ['щ'] = "sh",
        ['ъ'] = "",
        ['ы'] = "i",
        ['ь'] = "",
        ['э'] = "e",
        ['ю'] = "yu",
        ['я'] = "ya",
        ['ў'] = "o",
        ['қ'] = "q",
        ['ғ'] = "g",
        ['ҳ'] = "h"
    };

    public static string Slugify(string input)
    {
        var sb = new StringBuilder();

        foreach (var ch in input.Trim().ToLowerInvariant())
        {
            if (Map.TryGetValue(ch, out var latin)) { sb.Append(latin); continue; }
            if (ch is '\'' or 'ʻ' or 'ʼ' or '’' or '`') continue; // o'zbek -> ozbek

            // Strip accents from Latin letters (é -> e)
            var decomposed = ch.ToString().Normalize(NormalizationForm.FormD);
            foreach (var c in decomposed)
            {
                if (CharUnicodeInfo.GetUnicodeCategory(c) == UnicodeCategory.NonSpacingMark) continue;
                if (c is >= 'a' and <= 'z' or >= '0' and <= '9') sb.Append(c);
                else sb.Append('-');
            }
        }

        var slug = Regex.Replace(sb.ToString(), "-{2,}", "-").Trim('-');
        if (slug.Length > 60) slug = slug[..60].Trim('-');
        return slug.Length == 0 ? "restaurant" : slug;
    }

    public async Task<string> GenerateUniqueAsync(string name)
    {
        var baseSlug = Slugify(name);
        var candidate = baseSlug;
        var i = 2;

        while (await _db.Restaurants.AnyAsync(r => r.Slug == candidate))
            candidate = $"{baseSlug}-{i++}";

        return candidate;
    }
}
