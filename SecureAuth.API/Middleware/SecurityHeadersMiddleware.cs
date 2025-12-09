using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace SecureAuth.API.Middleware
{
    public class SecurityHeadersMiddleware
    {
        private readonly RequestDelegate _next;

        public SecurityHeadersMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Always add X-Content-Type-Options to prevent MIME-sniffing
            // This is critical for security and should be on all responses
            context.Response.Headers["X-Content-Type-Options"] = "nosniff";
            
            // Skip other security headers for CORS preflight requests
            if (context.Request.Method == "OPTIONS")
            {
                await _next(context);
                return;
            }

            // Security Headers
            context.Response.Headers["X-Frame-Options"] = "DENY";
            // X-XSS-Protection is deprecated in modern browsers - CSP provides better XSS protection
            context.Response.Headers["Referrer-Policy"] = "no-referrer-when-downgrade";
            
            // Additional security headers to fix scan issues
            context.Response.Headers["X-Permitted-Cross-Domain-Policies"] = "none";
            context.Response.Headers["Cross-Origin-Embedder-Policy"] = "require-corp";
            context.Response.Headers["Cross-Origin-Opener-Policy"] = "same-origin";
            context.Response.Headers["Cross-Origin-Resource-Policy"] = "same-origin";
            // Content Security Policy - Note: unsafe-inline is required for Angular
            // Angular generates inline styles and scripts dynamically
            // This is a known security trade-off for SPAs
            context.Response.Headers["Content-Security-Policy"] =
                                     "default-src 'self'; " +
                                     "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com; " +
                                     "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; " +
                                     "img-src 'self' data: blob: https:; " +
                                     "font-src 'self' data: https:; " +
                                     "connect-src 'self' " +
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
                                     "https://maps.googleapis.com; " +
                                     "frame-ancestors 'none'; " +
                                     "base-uri 'self'; " +
                                     "form-action 'self'; " +
                                     "object-src 'none'; " +
                                     "upgrade-insecure-requests; " +
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
            var path = context.Request.Path.Value ?? "";
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
            context.Response.Headers.Remove("Server");
            context.Response.Headers.Remove("X-Powered-By");
            context.Response.Headers.Remove("X-AspNet-Version");
            context.Response.Headers.Remove("X-AspNetMvc-Version");
            context.Response.Headers.Remove("X-Runtime");
            context.Response.Headers.Remove("X-Version");
            
            await _next(context);
        }
    }
} 