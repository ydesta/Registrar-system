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
            // Skip security headers for CORS preflight requests
            if (context.Request.Method == "OPTIONS")
            {
                await _next(context);
                return;
            }

            // Security Headers
            context.Response.Headers["X-Content-Type-Options"] = "nosniff";
            context.Response.Headers["X-Frame-Options"] = "DENY";
            context.Response.Headers["X-XSS-Protection"] = "1; mode=block";
            context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
            context.Response.Headers["Content-Security-Policy"] =
                                     "default-src 'self'; " +
                                     "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
                                     "style-src 'self' 'unsafe-inline'; " +
                                     "img-src 'self' data: https:; " +
                                     "font-src 'self' https:; " +
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
                                     "https://maps.googleapis.com; " +
                                     "frame-ancestors 'none';";

            // Additional Security Headers
            context.Response.Headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()";
            context.Response.Headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload";
            context.Response.Headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
            context.Response.Headers["Pragma"] = "no-cache";
            context.Response.Headers["Expires"] = "0";
            
            // Remove server information
            context.Response.Headers.Remove("Server");
            context.Response.Headers.Remove("X-Powered-By");
            
            await _next(context);
        }
    }
} 