using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace SecureAuth.API.Middleware
{
    /// <summary>
    /// Security Middleware to block requests from testing tools (Postman, curl, etc.) and only allow requests from the Angular frontend.
    /// 
    /// Security Features:
    /// 1. Requires X-Client-App header with secret key (only known to legitimate frontend)
    /// 2. Blocks known testing tool User-Agents (Postman, curl, etc.)
    ///    - PRODUCTION: Blocks testing tools even with valid header (strict security)
    ///    - DEVELOPMENT: Allows testing tools IF they have valid X-Client-App header (for legitimate testing)
    /// 3. Validates Origin/Referer headers for CORS requests
    /// 4. Blocks requests with no Origin/Referer (typical of testing tools)
    ///    - PRODUCTION: Blocks even with valid header
    ///    - DEVELOPMENT: Allows if they have valid X-Client-App header
    /// 5. Comprehensive security logging for all blocked attempts
    /// 
    /// Development Mode Behavior:
    /// - Legitimate developers/testers can use Postman/curl by including the X-Client-App header
    /// - The header value must match the configured Security:FrontendClientKey
    /// - All requests are still logged for security monitoring
    /// 
    /// Production Mode Behavior:
    /// - Strict security: Testing tools are blocked even with valid header
    /// - Only legitimate browser requests from the Angular frontend are allowed
    /// - All suspicious access attempts are logged as SECURITY ALERT for monitoring
    /// </summary>
    public class FrontendRequestValidationMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly string[] _allowedOrigins;
        private readonly string[] _blockedUserAgents;
        private readonly string _requiredClientValue;
        private readonly bool _isDevelopment;
        private const string REQUIRED_CLIENT_HEADER = "X-Client-App";

        public FrontendRequestValidationMiddleware(RequestDelegate next, IConfiguration configuration)
        {
            _next = next;
            
            // Get the complex client key from configuration
            _requiredClientValue = configuration["Security:FrontendClientKey"] 
                ?? throw new InvalidOperationException("Security:FrontendClientKey is not configured in appsettings.json");
            
            // Check if we're in development mode
            var environment = configuration.GetValue<string>("ASPNETCORE_ENVIRONMENT");
            _isDevelopment = string.Equals(environment, "Development", StringComparison.OrdinalIgnoreCase);
            
            // Allowed origins for the Angular frontend
            _allowedOrigins = new[]
            {
                "https://hsis.hilcoe.edu.et",
                "https://staging.hilcoe.edu.et",
                "https://hilcoe.edu.et",
                "https://hilcoe.edu.et:5001",
                "https://hilcoe.edu.et:5000",
                "https://hilcoe.edu.et:36201",
                "https://localhost:5001",
                "https://localhost:36201",
                "https://localhost:7123",
                "http://localhost:4200",
                "https://localhost:4200",
                "http://localhost:5000"
            };

            // User agents of common testing tools to block
            _blockedUserAgents = new[]
            {
                "PostmanRuntime",
                "Postman",
                "curl",
                "Wget",
                "HTTPie",
                "httpie",
                "Insomnia",
                "REST Client",
                "Thunder Client",
                "Bruno",
                "Paw",
                "Go-http-client",
                "Java/",
                "python-requests",
                "node-fetch",
                "axios",
                "okhttp",
                "Apache-HttpClient",
                "RestSharp",
                "HttpClient",
                "HttpURLConnection",
                "python-urllib",
                "scrapy",
                "requests",
                "urllib",
                "libwww-perl",
                "WWW-Mechanize",
                "mechanize",
                "Fiddler",
                "Charles",
                "Burp",
                "ZAP",
                "SoapUI",
                "JMeter",
                "Gatling",
                "Artillery",
                "k6",
                "Vegeta",
                "ab",
                "wrk",
                "siege",
                "httperf",
                "locust"
            };
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // 🔍 DEBUG BREAKPOINT: Set breakpoint on next line to verify middleware is being called
            // This line will ALWAYS execute if middleware is registered and request reaches it
            System.Diagnostics.Debugger.Break(); // Force breakpoint - will stop here if middleware executes
            
            var path = context.Request.Path.Value ?? "";
            var pathLower = path.ToLower();
            var logger = context.RequestServices.GetService<Microsoft.Extensions.Logging.ILogger<FrontendRequestValidationMiddleware>>();
            
            // Log all requests to help diagnose why middleware isn't being hit
            logger?.LogInformation("SecureAuthAPI FrontendRequestValidationMiddleware - Method: {Method}, Path: {Path}", 
                context.Request.Method, path);
            
            // Allow CORS preflight requests
            if (context.Request.Method == "OPTIONS")
            {
                await _next(context);
                return;
            }

            // Allow Swagger UI static files in development (CSS, JS, JSON schema files)
            // But API calls from Swagger should still go through validation
            if (pathLower.StartsWith("/swagger") || pathLower.StartsWith("/swaggerui"))
            {
                // Only exclude Swagger UI static resources, not API endpoints
                // API endpoints like /api/authentication/login should still be validated
                if (pathLower.StartsWith("/swagger/v") || 
                    pathLower.Contains("/swagger-ui") || 
                    pathLower.Contains("/swagger.json") ||
                    pathLower.EndsWith(".css") ||
                    pathLower.EndsWith(".js") ||
                    pathLower.EndsWith(".map"))
            {
                await _next(context);
                return;
                }
                // If it's a Swagger path but not a static resource, continue to validation
            }

            // Allow health check endpoints (including /api/authentication/health, /api/health, etc.)
            if (pathLower.StartsWith("/health") || 
                pathLower.Contains("/health") || 
                pathLower == "/" ||
                pathLower.EndsWith("/health"))
            {
                await _next(context);
                return;
            }

            // Allow authentication endpoints - these are public and need to work before authentication
            // The route is /api/authentication/login (from [Route("api/[controller]")] + [HttpPost("login")])
            var isAuthEndpoint = pathLower.Contains("/api/authentication/login") ||
                                 pathLower.Contains("/api/authentication/register") ||
                                 pathLower.Contains("/api/authentication/test-login") ||
                                 pathLower.Contains("/api/authentication/database-check") ||
                                 pathLower.Contains("/api/authentication/verify-otp") ||
                                 pathLower.Contains("/api/authentication/forgot-password") ||
                                 pathLower.Contains("/api/authentication/reset-password") ||
                                 pathLower.Contains("/api/authentication/verify-email") ||
                                 pathLower.Contains("/api/authentication/resend-verification") ||
                                 pathLower.Contains("/api/authentication/resend-otp") ||
                                 pathLower.Contains("/api/authentication/csrf-token") ||
                                 pathLower.Contains("/api/authentication/change-password") ||
                                 pathLower.Contains("/api/authentication/refresh-token");
            
            logger?.LogInformation("Auth endpoint check - Path: {Path}, IsAuthEndpoint: {IsAuthEndpoint}", path, isAuthEndpoint);
            
            if (isAuthEndpoint)
            {
                // For auth endpoints, validate X-Client-App header AND check for testing tools
                var clientHeader = GetClientHeaderValue(context);
                
                // Get request details for security logging
                var userAgent = context.Request.Headers.ContainsKey("User-Agent") 
                    ? context.Request.Headers["User-Agent"].ToString() 
                    : "(not provided)";
                var origin = context.Request.Headers.ContainsKey("Origin") 
                    ? context.Request.Headers["Origin"].ToString() 
                    : "(not provided)";
                var referer = context.Request.Headers.ContainsKey("Referer") 
                    ? context.Request.Headers["Referer"].ToString() 
                    : "(not provided)";
                var remoteIp = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
                
                // Debug logging - log all headers for troubleshooting
                var allHeaders = string.Join(", ", context.Request.Headers.Keys);
                logger?.LogInformation(
                    "Auth endpoint request - Path: {Path}, IP: {IP}, Header present: {HasHeader}, UserAgent: {UserAgent}, Origin: {Origin}, All headers: {AllHeaders}",
                    context.Request.Path,
                    remoteIp,
                    !string.IsNullOrEmpty(clientHeader),
                    userAgent,
                    origin,
                    allHeaders
                );
                
                // SECURITY CHECK 1: Block known testing tools by User-Agent
                // In DEVELOPMENT: Allow testing tools IF they have valid X-Client-App header (for legitimate testing)
                // In PRODUCTION: Block testing tools even with valid header (strict security)
                if (!string.IsNullOrEmpty(userAgent))
                {
                    var isBlockedUserAgent = _blockedUserAgents.Any(blocked => 
                        userAgent.Contains(blocked, StringComparison.OrdinalIgnoreCase));
                    
                    if (isBlockedUserAgent)
                    {
                        // Check if they have valid X-Client-App header
                        var hasValidHeader = !string.IsNullOrEmpty(clientHeader) && 
                                           clientHeader.Equals(_requiredClientValue, StringComparison.OrdinalIgnoreCase);
                        
                        if (_isDevelopment && hasValidHeader)
                        {
                            // DEVELOPMENT MODE: Allow testing tools with valid header (for legitimate developers/testers)
                            logger?.LogWarning(
                                "⚠️ DEVELOPMENT MODE: Allowing testing tool request with valid X-Client-App header. IP: {IP}, Path: {Path}, UserAgent: {UserAgent}",
                                remoteIp,
                                context.Request.Path,
                                userAgent
                            );
                            // Continue to next check (header validation will pass)
                        }
                        else
                        {
                            // PRODUCTION MODE or missing/invalid header: Block testing tools
                            logger?.LogError(
                                "🚨 SECURITY ALERT: Blocked authentication request from testing tool. IP: {IP}, Path: {Path}, UserAgent: {UserAgent}, Origin: {Origin}, Referer: {Referer}, X-Client-App: {ClientApp}, HasValidHeader: {HasValidHeader}, Environment: {Environment}",
                                remoteIp,
                                context.Request.Path,
                                userAgent,
                                origin,
                                referer,
                                string.IsNullOrEmpty(clientHeader) ? "(not provided)" : (clientHeader.Length > 20 ? clientHeader.Substring(0, 20) + "..." : clientHeader),
                                hasValidHeader,
                                _isDevelopment ? "Development" : "Production"
                            );

                            context.Response.StatusCode = 403;
                            context.Response.ContentType = "application/json";
                            context.Response.Headers.Append("X-Middleware-Validation", "BLOCKED-TestingToolDetected");
                            
                            var errorResponse = new
                            {
                                error = "Unauthorized Access Detected",
                                message = "Unauthorized access attempt has been logged. If you require legitimate access to this system, please contact the system administrator immediately.",
                                reason = "Suspicious activity detected. All access attempts are monitored and logged for security purposes."
                            };

                            await context.Response.WriteAsJsonAsync(errorResponse);
                            return;
                        }
                    }
                }
                
                // SECURITY CHECK 2: Block requests with no Origin/Referer (typical of testing tools)
                // In DEVELOPMENT: Allow if they have valid X-Client-App header (testing tools don't send Origin/Referer)
                // In PRODUCTION: Still require Origin/Referer even with valid header (browser requests should have them)
                if (string.IsNullOrEmpty(origin) && string.IsNullOrEmpty(referer))
                {
                    var hasValidHeader = !string.IsNullOrEmpty(clientHeader) && 
                                       clientHeader.Equals(_requiredClientValue, StringComparison.OrdinalIgnoreCase);
                    
                    if (_isDevelopment && hasValidHeader)
                    {
                        // DEVELOPMENT MODE: Allow requests without Origin/Referer if they have valid header
                logger?.LogInformation(
                            "ℹ️ DEVELOPMENT MODE: Allowing request without Origin/Referer (testing tool) with valid X-Client-App header. IP: {IP}, Path: {Path}, UserAgent: {UserAgent}",
                            remoteIp,
                            context.Request.Path,
                            userAgent
                        );
                        // Continue to header validation check
                    }
                    else
                    {
                        // PRODUCTION MODE or missing/invalid header: Block requests without Origin/Referer
                        logger?.LogWarning(
                            "⚠️ SECURITY WARNING: Authentication request with no Origin/Referer headers. IP: {IP}, Path: {Path}, UserAgent: {UserAgent}, X-Client-App: {ClientApp}, HasValidHeader: {HasValidHeader}, Environment: {Environment}",
                            remoteIp,
                    context.Request.Path,
                            userAgent,
                            string.IsNullOrEmpty(clientHeader) ? "(not provided)" : (clientHeader.Length > 20 ? clientHeader.Substring(0, 20) + "..." : clientHeader),
                            hasValidHeader,
                            _isDevelopment ? "Development" : "Production"
                        );
                        
                        // Block if header is also missing/invalid
                if (string.IsNullOrEmpty(clientHeader) || !clientHeader.Equals(_requiredClientValue, StringComparison.OrdinalIgnoreCase))
                {
                            logger?.LogError(
                                "🚨 SECURITY ALERT: Blocked authentication request - Missing/invalid X-Client-App AND no Origin/Referer. IP: {IP}, Path: {Path}, UserAgent: {UserAgent}",
                                remoteIp,
                            context.Request.Path,
                                userAgent
                            );

                            context.Response.StatusCode = 403;
                            context.Response.ContentType = "application/json";
                            context.Response.Headers.Append("X-Middleware-Validation", "BLOCKED-MissingHeaderAndOrigin");
                            
                            var errorResponse = new
                            {
                                error = "Unauthorized Access Detected",
                                message = "Unauthorized access attempt has been logged. If you require legitimate access to this system, please contact the system administrator immediately.",
                                reason = "Suspicious activity detected. All access attempts are monitored and logged for security purposes."
                            };

                            await context.Response.WriteAsJsonAsync(errorResponse);
                        return;
                    }
                    }
                }
                
                // SECURITY CHECK 3: Always require the X-Client-App header - block if missing or invalid
                if (string.IsNullOrEmpty(clientHeader) || !clientHeader.Equals(_requiredClientValue, StringComparison.OrdinalIgnoreCase))
                {
                    // SECURITY INCIDENT: Missing or invalid header
                    logger?.LogError(
                        "🚨 SECURITY ALERT: Blocked authentication request - Missing or invalid X-Client-App header. IP: {IP}, Path: {Path}, UserAgent: {UserAgent}, Origin: {Origin}, Received: {Received}, Expected: {Expected}",
                        remoteIp,
                            context.Request.Path,
                        userAgent,
                        origin,
                            string.IsNullOrEmpty(clientHeader) ? "(empty)" : clientHeader,
                            _requiredClientValue
                        );

                    context.Response.StatusCode = 403;
                        context.Response.ContentType = "application/json";
                    context.Response.Headers.Append("X-Middleware-Validation", 
                        $"FAILED-MissingOrInvalidHeader-{(string.IsNullOrEmpty(clientHeader) ? "NotProvided" : "InvalidValue")}");
                        
                        var errorResponse = new
                        {
                        error = "Unauthorized Access Detected",
                        message = "Unauthorized access attempt has been logged. If you require legitimate access to this system, please contact the system administrator immediately.",
                        reason = "Suspicious activity detected. All access attempts are monitored and logged for security purposes."
                        };

                        await context.Response.WriteAsJsonAsync(errorResponse);
                        return;
                    }
                
                // All security checks passed
                logger?.LogInformation("✅ Auth endpoint request validated successfully - Path: {Path}, IP: {IP}, X-Client-App header is valid", 
                    context.Request.Path, remoteIp);
                context.Response.Headers.Append("X-Middleware-Validation", "PASSED-ValidHeader");
                await _next(context);
                return;
            }

            // Validate request is from Angular frontend
            var validationResult = ValidateRequest(context);
            
            if (!validationResult.IsValid)
            {
                // Safely get header values for security logging
                var clientAppHeader = GetClientHeaderValue(context);
                var userAgent = context.Request.Headers.ContainsKey("User-Agent") 
                    ? context.Request.Headers["User-Agent"].ToString() 
                    : "(not provided)";
                var origin = context.Request.Headers.ContainsKey("Origin") 
                    ? context.Request.Headers["Origin"].ToString() 
                    : "(not provided)";
                var referer = context.Request.Headers.ContainsKey("Referer") 
                    ? context.Request.Headers["Referer"].ToString() 
                    : "(not provided)";
                var remoteIp = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
                
                // SECURITY INCIDENT: Log as error for security monitoring
                logger?.LogError(
                    "🚨 SECURITY ALERT: Blocked suspicious request - Reason: {Reason}, IP: {IP}, UserAgent: {UserAgent}, Path: {Path}, Origin: {Origin}, Referer: {Referer}, X-Client-App: {ClientApp}",
                    validationResult.Reason,
                    remoteIp,
                    userAgent,
                    context.Request.Path,
                    origin,
                    referer,
                    string.IsNullOrEmpty(clientAppHeader) ? "(not provided)" : (clientAppHeader.Length > 50 ? clientAppHeader.Substring(0, 50) + "..." : clientAppHeader)
                );

                context.Response.StatusCode = 403;
                context.Response.ContentType = "application/json";
                
                // Add validation header to show middleware ran
                context.Response.Headers.Append("X-Middleware-Validation", $"BLOCKED-{validationResult.Reason}");
                
                var errorResponse = new
                {
                    error = "Unauthorized Access Detected",
                    message = "Unauthorized access attempt has been logged. If you require legitimate access to this system, please contact the system administrator immediately.",
                    reason = "Suspicious activity detected. All access attempts are monitored and logged for security purposes."
                };

                await context.Response.WriteAsJsonAsync(errorResponse);
                return;
            }

            // Request passed validation - add header to indicate middleware ran
            context.Response.Headers.Append("X-Middleware-Validation", "PASSED-ValidRequest");
            logger?.LogInformation("✅ Request passed FrontendRequestValidationMiddleware - Path: {Path}", context.Request.Path);
            await _next(context);
        }

        private string GetClientHeaderValue(HttpContext context)
        {
            // ASP.NET Core's IHeaderDictionary is case-insensitive by default
            // Try direct access first
            if (context.Request.Headers.TryGetValue(REQUIRED_CLIENT_HEADER, out var headerValue))
            {
                return headerValue.ToString().Trim();
            }
            
            // Try case-insensitive search as fallback
            var headerKey = context.Request.Headers.Keys.FirstOrDefault(
                k => k.Equals(REQUIRED_CLIENT_HEADER, StringComparison.OrdinalIgnoreCase));
            if (headerKey != null && context.Request.Headers.TryGetValue(headerKey, out var foundValue))
            {
                return foundValue.ToString().Trim();
            }
            
            return string.Empty;
        }

        private ValidationResult ValidateRequest(HttpContext context)
        {
            var logger = context.RequestServices.GetService<Microsoft.Extensions.Logging.ILogger<FrontendRequestValidationMiddleware>>();
            
            // Check 1: Require custom client header (only Angular app sends this)
            var clientHeader = GetClientHeaderValue(context);
            
            // Debug logging
            var allHeaders = string.Join(", ", context.Request.Headers.Keys);
            logger?.LogInformation(
                "ValidateRequest - Path: {Path}, Header present: {HasHeader}, Header value: {HeaderValue}, Expected: {ExpectedValue}, All headers: {AllHeaders}",
                context.Request.Path,
                !string.IsNullOrEmpty(clientHeader),
                string.IsNullOrEmpty(clientHeader) ? "(empty)" : (clientHeader.Length > 20 ? clientHeader.Substring(0, 20) + "..." : clientHeader),
                _requiredClientValue.Length > 20 ? _requiredClientValue.Substring(0, 20) + "..." : _requiredClientValue,
                allHeaders
            );
            
            var hasValidClientHeader = !string.IsNullOrEmpty(clientHeader) && 
                                      clientHeader.Equals(_requiredClientValue, StringComparison.OrdinalIgnoreCase);
            
            if (!hasValidClientHeader)
            {
                return new ValidationResult
                {
                    IsValid = false,
                    Reason = $"Missing or invalid X-Client-App header. Expected: {_requiredClientValue.Substring(0, Math.Min(20, _requiredClientValue.Length))}..., Received: {(string.IsNullOrEmpty(clientHeader) ? "null" : clientHeader.Substring(0, Math.Min(20, clientHeader.Length)) + "...")}"
                };
            }

            // Check 2: Block known testing tool User-Agents
            // In DEVELOPMENT: Allow testing tools IF they have valid X-Client-App header (for legitimate testing)
            // In PRODUCTION: Block testing tools even with valid header (strict security)
            var userAgent = context.Request.Headers["User-Agent"].ToString();
            if (!string.IsNullOrEmpty(userAgent))
            {
                var isBlockedUserAgent = _blockedUserAgents.Any(blocked => 
                    userAgent.Contains(blocked, StringComparison.OrdinalIgnoreCase));
                
                if (isBlockedUserAgent)
                {
                    // In development mode, allow testing tools if they have valid header
                    if (_isDevelopment && hasValidClientHeader)
                    {
                        // Allow in development - legitimate developers/testers can use testing tools
                        // Continue to next validation checks
                    }
                    else
                    {
                        // Production mode or missing/invalid header: Block testing tools
                    return new ValidationResult
                    {
                        IsValid = false,
                            Reason = $"Request blocked: Testing tool detected (User-Agent: {userAgent}). In production, testing tools are not allowed even with valid header."
                    };
                    }
                }
            }

            // Check 3: Validate Origin header (for CORS requests)
            // IMPORTANT: If X-Client-App header is valid, be more lenient with Origin validation
            var origin = context.Request.Headers["Origin"].ToString();
            if (!string.IsNullOrEmpty(origin))
            {
                var isValidOrigin = _allowedOrigins.Any(allowed => 
                    origin.Equals(allowed, StringComparison.OrdinalIgnoreCase));
                
                if (!isValidOrigin)
                {
                    // If X-Client-App header is valid, allow any hilcoe.edu.et domain (any subdomain or port)
                    // This handles production scenarios where frontend might be on different subdomains
                    if (hasValidClientHeader)
                    {
                        // Allow if it's a hilcoe.edu.et domain (any subdomain, port, or protocol)
                        if (origin.Contains("hilcoe.edu.et", StringComparison.OrdinalIgnoreCase))
                        {
                            // Allow this origin - it's a valid hilcoe.edu.et domain
                            isValidOrigin = true;
                        }
                    }
                    
                    // If still not valid, check for localhost (development)
                    if (!isValidOrigin)
                    {
                        if (origin.StartsWith("http://localhost:", StringComparison.OrdinalIgnoreCase) ||
                            origin.StartsWith("https://localhost:", StringComparison.OrdinalIgnoreCase))
                        {
                            isValidOrigin = true;
                        }
                    }
                    
                    // If still not valid, reject
                    if (!isValidOrigin)
                    {
                        return new ValidationResult
                        {
                            IsValid = false,
                            Reason = $"Invalid Origin header: {origin}. Only requests from authorized frontend origins are allowed."
                        };
                    }
                }
            }

            // Check 4: Validate Referer header as additional check (for same-origin requests)
            var referer = context.Request.Headers["Referer"].ToString();
            if (!string.IsNullOrEmpty(referer))
            {
                try
                {
                    var refererUri = new Uri(referer);
                    var refererOrigin = $"{refererUri.Scheme}://{refererUri.Authority}";
                    
                    var isValidReferer = _allowedOrigins.Any(allowed => 
                        refererOrigin.Equals(allowed, StringComparison.OrdinalIgnoreCase));
                    
                    if (!isValidReferer)
                    {
                        // If X-Client-App is valid, allow hilcoe.edu.et domains
                        if (hasValidClientHeader && refererOrigin.Contains("hilcoe.edu.et", StringComparison.OrdinalIgnoreCase))
                        {
                            isValidReferer = true;
                        }
                        
                        // Allow localhost referers
                        if (!isValidReferer && 
                            (refererOrigin.StartsWith("http://localhost:", StringComparison.OrdinalIgnoreCase) ||
                             refererOrigin.StartsWith("https://localhost:", StringComparison.OrdinalIgnoreCase)))
                        {
                            isValidReferer = true;
                        }
                        
                        // Referer validation is less strict - just log it if invalid
                        // The main protection is the custom header and User-Agent check
                    }
                }
                catch
                {
                    // Invalid referer format - not a blocker, just log
                }
            }

            // Check 5: Block requests with no Origin/Referer AND suspicious User-Agent
            // (This catches curl, Postman, etc. that don't send Origin)
            // In DEVELOPMENT: Allow if they have valid X-Client-App header (testing tools don't send Origin/Referer)
            // In PRODUCTION: Block even with valid header (browser requests should have Origin/Referer)
            if (string.IsNullOrEmpty(origin) && string.IsNullOrEmpty(referer))
            {
                // If there's no origin/referer, the custom header check above should catch it
                // But if somehow they added the header, check User-Agent
                if (!string.IsNullOrEmpty(userAgent))
                {
                    var suspiciousPatterns = new[] { "curl", "wget", "postman", "httpie", "insomnia" };
                    if (suspiciousPatterns.Any(pattern => userAgent.Contains(pattern, StringComparison.OrdinalIgnoreCase)))
                    {
                        // In development mode, allow testing tools if they have valid header
                        if (_isDevelopment && hasValidClientHeader)
                        {
                            // Allow in development - legitimate developers/testers can use testing tools
                            // Continue validation
                        }
                        else
                        {
                            // Production mode or missing/invalid header: Block
                        return new ValidationResult
                        {
                            IsValid = false,
                            Reason = "Request blocked: Testing tool detected (no Origin/Referer with suspicious User-Agent)"
                        };
                        }
                    }
                }
            }

            return new ValidationResult { IsValid = true };
        }

        private class ValidationResult
        {
            public bool IsValid { get; set; }
            public string Reason { get; set; } = string.Empty;
        }
    }
}
