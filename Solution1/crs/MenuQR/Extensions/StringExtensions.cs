namespace MenuQR.Api.Extensions;

public static class StringExtensions
{
    // "  " or "" -> null, otherwise trimmed text
    public static string? ToNullIfBlank(this string? s) =>
        string.IsNullOrWhiteSpace(s) ? null : s.Trim();
}
