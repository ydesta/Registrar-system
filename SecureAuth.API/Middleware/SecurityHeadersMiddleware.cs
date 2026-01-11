using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using System;
using System.Security.Cryptography;
using System.Threading.Tasks;

namespace SecureAuth.API.Middleware
{
    /// <summary>
    /// Middleware to consistently apply security headers to all HTTP responses.
    /// This ensures protection against common web vulnerabilities including:
    /// - Clickjacking (X-Frame-Options)
    /// - MIME-sniffing (X-Content-Type-Options)
    /// - XSS attacks (Content-Security-Policy)
    /// - Man-in-the-middle attacks (Strict-Transport-Security)
    /// - Information disclosure (removes server headers)
    /// </summary>
    public class SecurityHeadersMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IWebHostEnvironment _environment;

        public SecurityHeadersMiddleware(RequestDelegate next, IWebHostEnvironment environment)
        {
            _next = next;
            _environment = environment;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Always add X-Content-Type-Options to prevent MIME-sniffing
            // This is critical for security and should be on all responses
            context.Response.Headers["X-Content-Type-Options"] = "nosniff";
            
            // Skip other security headers for CORS preflight requests (OPTIONS)
            // But keep X-Content-Type-Options for consistency
            if (context.Request.Method == "OPTIONS")
            {
                await _next(context);
                return;
            }

            // Core Security Headers
            context.Response.Headers["X-Frame-Options"] = "DENY";
            context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
            
            // Strict-Transport-Security (HSTS) - Only for HTTPS requests in production
            if (context.Request.IsHttps && !_environment.IsDevelopment())
            {
                context.Response.Headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload";
            }
            
            // Cross-Origin Security Headers
            context.Response.Headers["X-Permitted-Cross-Domain-Policies"] = "none";
            context.Response.Headers["Cross-Origin-Embedder-Policy"] = "require-corp";
            context.Response.Headers["Cross-Origin-Opener-Policy"] = "same-origin";
            context.Response.Headers["Cross-Origin-Resource-Policy"] = "same-origin";
            // Content Security Policy - Using nonces for better security
            // Generate nonce for this request
            var nonce = Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(16))
                .Replace("+", "-")
                .Replace("/", "_")
                .Replace("=", "");
            
            // Store nonce in context for use by other middleware/components
            context.Items["CSP-Nonce"] = nonce;
            
            // Check if this is a development tool path that needs permissive CSP
            var path = context.Request.Path.Value ?? "";
            var isDevToolPath = path.StartsWith("/swagger", StringComparison.OrdinalIgnoreCase) ||
                               path.StartsWith("/_vs/", StringComparison.OrdinalIgnoreCase) ||
                               path.StartsWith("/_framework/", StringComparison.OrdinalIgnoreCase);
            
            // Check if request is from localhost (development scenario)
            var host = context.Request.Host.Host;
            var isLocalhost = host.Equals("localhost", StringComparison.OrdinalIgnoreCase) ||
                             host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase) ||
                             host.StartsWith("localhost", StringComparison.OrdinalIgnoreCase);
            
            // Build CSP based on environment, path, and host
            var isDevelopment = _environment.IsDevelopment() || isDevToolPath || isLocalhost;
            var scriptSrc = isDevelopment
                ? $"script-src 'self' 'nonce-{nonce}' 'unsafe-inline' 'unsafe-eval' http://localhost:5000 http://localhost:5001 http://localhost:7123 http://localhost:4200 https://localhost:5000 https://localhost:5001 https://localhost:7123 https://localhost:4200 https://maps.googleapis.com"
                : $"script-src 'self' 'nonce-{nonce}' 'strict-dynamic' https://maps.googleapis.com";
            
            // script-src-elem for <script> elements (separate from script-src for better control)
            // In development or dev tool paths, we don't use strict-dynamic to allow development tools
            var scriptSrcElem = isDevelopment
                ? $"script-src-elem 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:5000 http://localhost:5001 http://localhost:7123 http://localhost:4200 https://localhost:5000 https://localhost:5001 https://localhost:7123 https://localhost:4200 https://maps.googleapis.com"
                : $"script-src-elem 'self' 'nonce-{nonce}' 'strict-dynamic' https://maps.googleapis.com";
            
            var connectSrc = isDevelopment
                ? "'self' " +
                                     "https://hilcoe.edu.et " +
                                     "https://hilcoe.edu.et:7123 " +
                                     "https://hilcoe.edu.et:5000 " +
                                     "https://hilcoe.edu.et:5001 " +
                                     "https://hilcoe.edu.et:5002 " +
                                     "https://hilcoe.edu.et:36201 " +
                                     "https://staging.hilcoe.edu.et " +
                                     "https://staging.hilcoe.edu.et:7123 " +
                                     "https://staging.hilcoe.edu.et:5000 " +
                                     "https://staging.hilcoe.edu.et:5001 " +
                                     "https://staging.hilcoe.edu.et:5002 " +
                                     "https://staging.hilcoe.edu.et:36201 " +
                                     "https://hsis.hilcoe.edu.et " +
                                     "https://localhost:7123 " +
                                     "https://localhost:5000 " +
                                     "https://localhost:5001 " +
                                     "https://localhost:5002 " +
                                     "https://localhost:36201 " +
                                     "http://localhost:4200 " +
                                     "https://localhost:4200 " +
                                     "ws: wss: " +
                  "https://maps.googleapis.com"
                : "'self' " +
                  "https://hilcoe.edu.et " +
                  "https://hilcoe.edu.et:7123 " +
                  "https://hilcoe.edu.et:5000 " +
                  "https://hilcoe.edu.et:5001 " +
                  "https://hilcoe.edu.et:5002 " +
                  "https://hilcoe.edu.et:36201 " +
                  "https://staging.hilcoe.edu.et " +
                  "https://staging.hilcoe.edu.et:7123 " +
                  "https://staging.hilcoe.edu.et:5000 " +
                  "https://staging.hilcoe.edu.et:5001 " +
                  "https://staging.hilcoe.edu.et:5002 " +
                  "https://staging.hilcoe.edu.et:36201 " +
                  "https://hsis.hilcoe.edu.et " +
                  "wss: " +
                  "https://maps.googleapis.com";
            
            context.Response.Headers["Content-Security-Policy"] =
                                     "default-src 'self'; " +
                                     $"{scriptSrc}; " +
                                     $"{scriptSrcElem}; " +
                                     "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; " +
                                     "img-src 'self' data: blob: https:; " +
                                     "font-src 'self' data: https:; " +
                                     $"connect-src {connectSrc}; " +
                                     "frame-ancestors 'none'; " +
                                     "base-uri 'self'; " +
                                     "form-action 'self'; " +
                                     "object-src 'none'; " +
                                     (isDevelopment ? "" : "upgrade-insecure-requests; ") +
                                     "worker-src 'self'; " +
                                     "manifest-src 'self';";

            // Additional security headers
            context.Response.Headers["Permissions-Policy"] = 
                                     "geolocation=(), " +
                                     "microphone=(), " +
                                     "camera=(), " +
                                     "usb=(), " +
                                     "magnetometer=(), " +
                                     "gyroscope=(), " +
                                     "speaker=(), " +
                                     "vibrate=(), " +
                                     "fullscreen=(self), " +
                                     "payment=(), " +
                                     "accelerometer=(), " +
                                     "ambient-light-sensor=(), " +
                                     "autoplay=(), " +
                                     "battery=(), " +
                                     "bluetooth=(), " +
                                     "clipboard-read=(), " +
                                     "clipboard-write=(), " +
                                     "display-capture=(), " +
                                     "document-domain=(), " +
                                     "encrypted-media=(), " +
                                     "execution-while-not-rendered=(), " +
                                     "execution-while-out-of-viewport=(), " +
                                     "font-display-late-swap=(), " +
                                     "hid=(), " +
                                     "idle-detection=(), " +
                                     "local-fonts=(), " +
                                     "midi=(), " +
                                     "oversized-images=(), " +
                                     "picture-in-picture=(), " +
                                     "publickey-credentials-get=(), " +
                                     "screen-wake-lock=(), " +
                                     "serial=(), " +
                                     "sync-xhr=(), " +
                                     "trust-token-redemption=(), " +
                                     "unload=(), " +
                                     "web-share=(), " +
                                     "xr-spatial-tracking=()";

            // Smart cache control based on endpoint
            var isStaticAsset = path.StartsWith("/assets/") || 
                               path.EndsWith(".js") || 
                               path.EndsWith(".css") || 
                               path.EndsWith(".png") || 
                               path.EndsWith(".jpg") || 
                               path.EndsWith(".ico");
                               
            if (isStaticAsset)
            {
                // Static assets can be cached for 7 days, then revalidate
                context.Response.Headers["Cache-Control"] = "public, max-age=604800, stale-while-revalidate=86400";
            }
            else if (path.StartsWith("/api/"))
            {
                // API endpoints - no cache
                context.Response.Headers["Cache-Control"] = "no-store, no-cache, must-revalidate, private";
                context.Response.Headers["Pragma"] = "no-cache";
                context.Response.Headers["Expires"] = "0";
            }
            else
            {
                // Other endpoints - no cache
                context.Response.Headers["Cache-Control"] = "no-store, no-cache, must-revalidate";
                context.Response.Headers["Pragma"] = "no-cache";
                context.Response.Headers["Expires"] = "0";
            }
            
            // Remove server information to prevent information disclosure
            // These headers can reveal technology stack and version information to attackers
            context.Response.Headers.Remove("Server");
            context.Response.Headers.Remove("X-Powered-By");
            context.Response.Headers.Remove("X-AspNet-Version");
            context.Response.Headers.Remove("X-AspNetMvc-Version");
            context.Response.Headers.Remove("X-Runtime");
            context.Response.Headers.Remove("X-Version");
            context.Response.Headers.Remove("X-SourceFiles");
            context.Response.Headers.Remove("X-Powered-By-AspNet");
            
            await _next(context);
        }
    }
} 