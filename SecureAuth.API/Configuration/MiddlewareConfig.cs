using Microsoft.AspNetCore.Builder;
using SecureAuth.API.Middleware;

namespace SecureAuth.API.Configuration
{
    /// <summary>
    /// Configuration for middleware pipeline
    /// </summary>
    public static class MiddlewareConfig
    {
        /// <summary>
        /// Configures the security middleware pipeline
        /// </summary>
        /// <param name="app">The web application builder</param>
        public static void ConfigureSecurityMiddleware(this WebApplication app)
        {
            // Add CORS middleware before other middleware
            app.UseCors("AllowAngularApp");

            // Add custom middleware
            app.UseMiddleware<CorsDebugMiddleware>();
            
            // Note: SecurityHeadersMiddleware and RateLimitingMiddleware
            // are temporarily disabled for testing and performance reasons
            // Uncomment when needed:
            // app.UseMiddleware<SecurityHeadersMiddleware>();
            // app.UseMiddleware<RateLimitingMiddleware>();

            // Add HTTPS redirection for production
            if (!app.Environment.IsDevelopment())
            {
                app.UseHttpsRedirection();
            }

            // Configure authentication and authorization pipeline
            app.UseAuthentication();      // Validates JWT tokens
            app.UseAntiforgery();         // Validates CSRF tokens
            app.UseAuthorization();       // Checks role permissions

            // Map controllers
            app.MapControllers();
        }

        /// <summary>
        /// Documents the middleware execution order
        /// </summary>
        public static class PipelineOrder
        {
            /// <summary>
            /// The critical middleware execution order
            /// </summary>
            public static readonly string[] ExecutionOrder = new[]
            {
                "1. UseCors - Configure cross-origin resource sharing",
                "2. UseMiddleware(CorsDebugMiddleware) - CORS debugging and logging",
                "3. UseHttpsRedirection - Force HTTPS in production",
                "4. UseExceptionHandler - Global exception handling",
                "5. UseAuthentication - Validate JWT tokens",
                "6. UseAntiforgery - Validate CSRF tokens",
                "7. UseAuthorization - Check role permissions",
                "8. MapControllers - Route requests to controllers"
            };

            /// <summary>
            /// Important security notes
            /// </summary>
            public static readonly string[] SecurityNotes = new[]
            {
                "Authentication must come before Antiforgery to ensure user identity is established",
                "Antiforgery must come before Authorization to validate CSRF tokens first",
                "Authorization checks are performed last to ensure all security layers are passed",
                "CORS middleware is first to allow cross-origin requests from Angular frontend"
            };
        }
    }
}

