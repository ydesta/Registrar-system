using System.Text.RegularExpressions;
using System.Web;
using Microsoft.Extensions.Logging;

namespace SecureAuth.APPLICATION.Services
{
    public interface IInputSanitizationService
    {
        string SanitizeText(string input);
        string SanitizeHtml(string input);
        string SanitizeEmail(string input);
        string SanitizePhone(string input);
        string SanitizeUrl(string input);
        bool IsInputSafe(string input);
        void LogPotentialXss(string input, string context);
    }

    public class InputSanitizationService : IInputSanitizationService
    {
        private readonly ILogger<InputSanitizationService> _logger;

        public InputSanitizationService(ILogger<InputSanitizationService> logger)
        {
            _logger = logger;
        }

        public string SanitizeText(string input)
        {
            if (string.IsNullOrEmpty(input))
                return string.Empty;

            // HTML encode the input to prevent XSS
            string sanitized = HttpUtility.HtmlEncode(input);

            // Remove any remaining script tags
            sanitized = Regex.Replace(sanitized, @"<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>", "", RegexOptions.IgnoreCase);

            // Remove javascript: protocols
            sanitized = Regex.Replace(sanitized, @"javascript:", "", RegexOptions.IgnoreCase);

            // Remove dangerous characters that might bypass encoding
            sanitized = Regex.Replace(sanitized, @"[<>""'%;()&+]", "");

            return sanitized.Trim();
        }

        public string SanitizeHtml(string input)
        {
            if (string.IsNullOrEmpty(input))
                return string.Empty;

            // Remove script tags and their content
            string sanitized = Regex.Replace(input, @"<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>", "", RegexOptions.IgnoreCase);

            // Remove javascript: protocols
            sanitized = Regex.Replace(sanitized, @"javascript:", "", RegexOptions.IgnoreCase);

            // Remove on* event handlers
            sanitized = Regex.Replace(sanitized, @"\son\w+\s*=\s*[""'][^""']*[""']", "", RegexOptions.IgnoreCase);

            // Remove dangerous attributes
            sanitized = Regex.Replace(sanitized, @"\s(style|onload|onerror|onclick|onmouseover)\s*=\s*[""'][^""']*[""']", "", RegexOptions.IgnoreCase);

            // Remove iframe, object, embed tags
            sanitized = Regex.Replace(sanitized, @"<(iframe|object|embed)\b[^>]*>.*?</\1>", "", RegexOptions.IgnoreCase | RegexOptions.Singleline);

            // Remove link and meta tags
            sanitized = Regex.Replace(sanitized, @"<(link|meta)\b[^>]*/?>", "", RegexOptions.IgnoreCase);

            return sanitized.Trim();
        }

        public string SanitizeEmail(string input)
        {
            if (string.IsNullOrEmpty(input))
                return string.Empty;

            // Basic email validation and sanitization
            string sanitized = input.Trim().ToLowerInvariant();

            // Email regex pattern
            string emailPattern = @"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$";
            
            if (Regex.IsMatch(sanitized, emailPattern))
            {
                return sanitized;
            }

            return string.Empty;
        }

        public string SanitizePhone(string input)
        {
            if (string.IsNullOrEmpty(input))
                return string.Empty;

            // Remove all non-digit characters except + at the beginning
            string sanitized = Regex.Replace(input, @"[^\d+]", "");

            // Ensure + is only at the beginning
            if (sanitized.Contains("+"))
            {
                sanitized = "+" + sanitized.Replace("+", "");
            }

            // Basic phone validation (7-15 digits)
            string phonePattern = @"^(\+)?[1-9]\d{6,14}$";
            
            if (Regex.IsMatch(sanitized, phonePattern))
            {
                return sanitized;
            }

            return string.Empty;
        }

        public string SanitizeUrl(string input)
        {
            if (string.IsNullOrEmpty(input))
                return string.Empty;

            // Remove javascript: and data: protocols
            string sanitized = Regex.Replace(input, @"^(javascript:|data:)", "", RegexOptions.IgnoreCase);

            // Basic URL validation
            if (Uri.TryCreate(sanitized, UriKind.Absolute, out Uri? uri))
            {
                // Only allow http and https protocols
                if (uri.Scheme == "http" || uri.Scheme == "https")
                {
                    return sanitized;
                }
            }

            return string.Empty;
        }

        public bool IsInputSafe(string input)
        {
            if (string.IsNullOrEmpty(input))
                return true;

            // Check for dangerous patterns
            string[] dangerousPatterns = {
                @"<script",
                @"javascript:",
                @"on\w+\s*=",
                @"<iframe",
                @"<object",
                @"<embed",
                @"<link",
                @"<meta",
                @"<style",
                @"expression\s*\(",
                @"vbscript:",
                @"data:text/html"
            };

            foreach (string pattern in dangerousPatterns)
            {
                if (Regex.IsMatch(input, pattern, RegexOptions.IgnoreCase))
                {
                    return false;
                }
            }

            return true;
        }

        public void LogPotentialXss(string input, string context)
        {
            _logger.LogWarning("Potential XSS attempt detected in {Context}: {Input}", 
                context, 
                input.Length > 100 ? input.Substring(0, 100) + "..." : input);

            // In production, you might want to send this to a security monitoring service
            // await _securityMonitoringService.LogSecurityEventAsync("potential_xss", new { input, context });
        }
    }
}
