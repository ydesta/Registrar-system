using System.Text.RegularExpressions;

namespace SecureAuth.APPLICATION.Helpers
{
    public static class EthiopianPhoneNumber
    {
        public const string ErrorMessage =
            "Use Ethio Telecom (09) or Safaricom (07). Examples: +2519xxxxxxxx, 09xxxxxxxx, 9xxxxxxxx, 07xxxxxxxx";

        private static readonly Regex DigitsOnly = new(@"^\d+$", RegexOptions.Compiled);
        private static readonly Regex NationalMobile = new(@"^[79]\d{8}$", RegexOptions.Compiled);

        public static bool TryNormalize(string? input, out string? normalized)
        {
            normalized = null;
            if (string.IsNullOrWhiteSpace(input))
            {
                return false;
            }

            var cleaned = Regex.Replace(input.Trim(), @"[\s\-\(\)]", string.Empty);
            if (cleaned.StartsWith("+"))
            {
                cleaned = cleaned[1..];
            }

            if (!DigitsOnly.IsMatch(cleaned))
            {
                return false;
            }

            string? national = null;
            if (cleaned.StartsWith("251") && cleaned.Length == 12)
            {
                national = cleaned[3..];
            }
            else if (cleaned.StartsWith("0") && cleaned.Length == 10)
            {
                national = cleaned[1..];
            }
            else if (cleaned.Length == 9)
            {
                national = cleaned;
            }

            if (national == null || !NationalMobile.IsMatch(national))
            {
                return false;
            }

            normalized = "+251" + national;
            return true;
        }

        public static string? NormalizeOrNull(string? input)
        {
            if (string.IsNullOrWhiteSpace(input))
            {
                return null;
            }

            return TryNormalize(input, out var normalized) ? normalized : null;
        }

        public static string? NormalizeOptional(string? input)
        {
            if (string.IsNullOrWhiteSpace(input))
            {
                return input;
            }

            return TryNormalize(input, out var normalized) ? normalized : input;
        }

        public static bool IsValid(string? input)
        {
            return TryNormalize(input, out _);
        }
    }
}
