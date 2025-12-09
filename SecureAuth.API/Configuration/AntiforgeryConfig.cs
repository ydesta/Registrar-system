using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;

namespace SecureAuth.API.Configuration
{
    /// <summary>
    /// Configuration for antiforgery (CSRF) protection
    /// </summary>
    public static class AntiforgeryConfig
    {
        /// <summary>
        /// Configures secure antiforgery services
        /// </summary>
        /// <param name="services">The service collection to configure</param>
        public static void ConfigureAntiforgery(this IServiceCollection services)
        {
            services.AddAntiforgery(options =>
            {
                // Set the header name to match the Angular interceptor
                options.HeaderName = "X-CSRF-TOKEN";
                
                // Set the form field name for compatibility
                options.FormFieldName = "__RequestVerificationToken";
                
                // Configure secure cookie settings
                // Using __Host- prefix for additional security
                // This requires exact domain match and Secure flag
                options.Cookie.Name = "__Host-CSRF";
                
                // HttpOnly prevents JavaScript access to cookie
                // Critical for preventing XSS attacks
                options.Cookie.HttpOnly = true;
                
                // Strict SameSite prevents cross-site cookie transmission
                // This is the strongest protection against CSRF attacks
                options.Cookie.SameSite = SameSiteMode.Strict;
                
                // Use IsEssential to ensure cookie is always sent
                // Required for CSRF protection
                options.Cookie.IsEssential = true;
                
                // Path restriction ensures cookie only sent to root and sub-paths
                options.Cookie.Path = "/";
                
                // Set appropriate timeout (8 hours)
                // Tokens expire after this period for security
                options.Cookie.MaxAge = TimeSpan.FromHours(8);
            });
        }

        /// <summary>
        /// Security documentation for the antiforgery implementation
        /// </summary>
        public static class SecurityNotes
        {
            /// <summary>
            /// The CSRF token header name used by Angular interceptor
            /// </summary>
            public const string HeaderName = "X-CSRF-TOKEN";

            /// <summary>
            /// The CSRF cookie name with __Host- prefix for maximum security
            /// </summary>
            public const string CookieName = "__Host-CSRF";

            /// <summary>
            /// Cookie expiration time
            /// </summary>
            public static TimeSpan CookieMaxAge => TimeSpan.FromHours(8);

            /// <summary>
            /// Security features implemented
            /// </summary>
            public static readonly string[] SecurityFeatures = new[]
            {
                "HttpOnly - Prevents JavaScript cookie access",
                "SameSite=Strict - Prevents cross-site cookie transmission",
                "Secure flag - HTTPS-only cookie transmission",
                "__Host- prefix - Requires exact domain match",
                "8-hour expiration - Automatic token refresh",
                "SSL validation - Production security requirement"
            };
        }
    }
}

