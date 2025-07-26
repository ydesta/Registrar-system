using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace SecureAuth.API.Middleware
{
    public class CorsDebugMiddleware
    {
        private readonly RequestDelegate _next;

        public CorsDebugMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Log CORS-related information
            var origin = context.Request.Headers["Origin"].ToString();
            var method = context.Request.Method;
            var path = context.Request.Path;

            // Log the request details
            System.Diagnostics.Debug.WriteLine($"CORS Debug: {method} {path} from {origin}");

            await _next(context);

            // Log response headers
            var corsHeaders = context.Response.Headers
                .Where(h => h.Key.StartsWith("Access-Control"))
                .Select(h => $"{h.Key}: {h.Value}");

            if (corsHeaders.Any())
            {
                System.Diagnostics.Debug.WriteLine($"CORS Headers: {string.Join(", ", corsHeaders)}");
            }
        }
    }
} 