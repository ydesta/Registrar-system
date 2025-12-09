using Microsoft.Extensions.Options;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.DOMAIN.Models.Security;
using System.Security.Claims;
using Microsoft.AspNetCore.Http.Features;

namespace SecureAuth.API.Middleware
{
    public class RateLimitingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IRateLimitingService _rateLimiter;
        private readonly RateLimitingPolicy _rateLimitingPolicy;
        private readonly ILogger<RateLimitingMiddleware> _logger;

        public RateLimitingMiddleware(
            RequestDelegate next,
            IRateLimitingService rateLimiter,
            IOptions<RateLimitingPolicy> rateLimitingPolicy,
            ILogger<RateLimitingMiddleware> logger)
        {
            _next = next;
            _rateLimiter = rateLimiter;
            _rateLimitingPolicy = rateLimitingPolicy.Value;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var stopwatch = System.Diagnostics.Stopwatch.StartNew();
            
            try
            {
                // Skip rate limiting for certain paths (health checks, swagger, etc.)
                if (ShouldSkipRateLimiting(context.Request.Path))
                {
                    await _next(context);
                    return;
                }

                // Only rate limit authentication/security-sensitive endpoints
                if (ShouldRateLimitEndpoint(context.Request.Path))
                {
                    var key = GetRateLimitKey(context);
                    if (string.IsNullOrEmpty(key))
                    {
                        await _next(context);
                        return;
                    }

                    // Use different limits based on endpoint type
                    int maxAttempts = GetRateLimitForEndpoint(context.Request.Path);
                    int timeWindowMinutes = _rateLimitingPolicy.TimeWindowMinutes;

                    // Check for specific rate limit attributes on the endpoint
                    var endpoint = context.GetEndpoint();
                    var rateLimitAttribute = endpoint?.Metadata?.GetMetadata<RateLimitAttribute>();
                    
                    if (rateLimitAttribute != null)
                    {
                        maxAttempts = rateLimitAttribute.MaxAttempts;
                        timeWindowMinutes = rateLimitAttribute.TimeWindowMinutes;
                        key = $"{key}:{context.Request.Path}"; // Add path to key for endpoint-specific rate limiting
                    }

                    // Check if rate limit will be exceeded BEFORE incrementing
                    var isRateLimited = await _rateLimiter.IsRateLimitExceededAsync(
                        key,
                        maxAttempts,
                        timeWindowMinutes);

                    if (isRateLimited)
                    {
                        _logger.LogWarning("Rate limit exceeded for {Key}", key);
                        context.Response.StatusCode = StatusCodes.Status429TooManyRequests;

                        // Add retry headers
                        context.Response.Headers.Add("Retry-After", (timeWindowMinutes * 60).ToString());
                        context.Response.Headers.Add("X-Retry-After", "1"); // For exponential backoff

                        await context.Response.WriteAsJsonAsync(new
                        {
                            error = "Too many requests. Please try again later.",
                            retryAfter = timeWindowMinutes * 60, // Convert to seconds
                            message = "Rate limit exceeded. Please wait before making more requests."
                        });
                        return;
                    }

                    // Only increment if not rate limited
                    await _rateLimiter.IncrementRequestCountAsync(key);
                }

                await _next(context);
                
                // Log performance metrics for rate-limited requests
                if (_logger.IsEnabled(LogLevel.Debug))
                {
                    stopwatch.Stop();
                    _logger.LogDebug("Rate limiting check completed in {ElapsedMs}ms for {Path}", 
                        stopwatch.ElapsedMilliseconds, context.Request.Path);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in rate limiting middleware");
                await _next(context); // Continue processing in case of errors
            }
        }
            

        private bool ShouldSkipRateLimiting(PathString path)
        {
            // Add paths that should be excluded from rate limiting
            var excludedPaths = new[]
            {
                "/health",
                "/metrics",
                "/swagger",
                "/favicon.ico",
                "/api/DashBorad", // Dashboard endpoints
                "/api/BatchTerms", // Batch terms endpoint
                "/api/User", // User management endpoints
                "/api/Admin", // Admin endpoints
                "/api/System", // System endpoints (activity logs, etc.)
                "/api/RolePermission", // Role permission endpoints
                "/api/UserManagement", // User management endpoints
                "/api/SystemDashboard", // System dashboard endpoints
                "/api/AdminController", // Admin controller endpoints
                "/api/students", // Student endpoints
                "/api/instructors", // Instructor endpoints
                "/api/courses", // Course endpoints
                "/api/academicTerms", // Academic terms endpoints
                "/api/applications", // Application endpoints
                "/api/admin", // Admin endpoints (with lowercase)
                "/api/admin/system-backups", // System backup endpoints
                "/api/admin/security-settings", // Security settings endpoints
                "/api/admin/SecurityThreats", // Security threats endpoints
                "/api/admin/SystemBackup", // System backup endpoints
                "/api/admin/SecuritySettings" // Security settings endpoints
            };

            return excludedPaths.Any(p => path.StartsWithSegments(p));
        }

        private string GetRateLimitKey(HttpContext context)
        {
            // Try to get user ID if authenticated
            var userId = context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(userId))
            {
                return $"user:{userId}";
            }

            // Fall back to IP address
            var ipAddress = context.Connection.RemoteIpAddress?.ToString();
            if (!string.IsNullOrEmpty(ipAddress))
            {
                return $"ip:{ipAddress}";
            }

            return null;
        }

        private bool ShouldRateLimitEndpoint(PathString path)
        {
            // Rate limit security-sensitive endpoints to prevent abuse
            var rateLimitedPaths = new[]
            {
                "/api/authentication/login",
                "/api/authentication/forgot-password",
                "/api/authentication/reset-password",
                "/api/authentication/verify-email",
                "/api/authentication/change-password"
            };

            return rateLimitedPaths.Any(p => path.StartsWithSegments(p));
        }

        private int GetRateLimitForEndpoint(PathString path)
        {
            // Different limits for different endpoint types
            if (path.StartsWithSegments("/api/authentication/login"))
            {
                return 10; // Strict limit for login (brute force prevention)
            }
            else if (path.StartsWithSegments("/api/authentication/forgot-password"))
            {
                return 20; // Password reset (20 per 15 min is reasonable)
            }
            else if (path.StartsWithSegments("/api/authentication/reset-password"))
            {
                return 20; // Password reset completion
            }
            else if (path.StartsWithSegments("/api/authentication/verify-email"))
            {
                return 20; // Email verification
            }
            else if (path.StartsWithSegments("/api/authentication/change-password"))
            {
                return 10; // Change password (strict for security)
            }

            return _rateLimitingPolicy.MaxAttempts; // Default fallback
        }

        private bool IsAuthenticationEndpoint(PathString path)
        {
            // Check if the path is an authentication-related endpoint
            var authPaths = new[]
            {
                "/api/authentication/login",
                "/api/authentication/register",
                "/api/authentication/verify-otp",
                "/api/authentication/resend-otp",
                "/api/authentication/forgot-password",
                "/api/authentication/reset-password",
                "/api/authentication/verify-email",
                "/api/authentication/resend-verification"
            };

            return authPaths.Any(p => path.StartsWithSegments(p));
        }
    }

    [AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public class RateLimitAttribute : Attribute
{
    public int MaxAttempts { get; }
    public int TimeWindowMinutes { get; }

    public RateLimitAttribute(int maxAttempts, int timeWindowMinutes)
    {
        MaxAttempts = maxAttempts;
        TimeWindowMinutes = timeWindowMinutes;
    }
}
} 