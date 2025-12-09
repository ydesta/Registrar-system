using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System.Net;
using System.Text.Json;

namespace SecureAuth.API.Middleware
{
    /// <summary>
    /// Security fix: Middleware to handle errors securely without exposing sensitive information
    /// </summary>
    public class SecureErrorHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<SecureErrorHandlingMiddleware> _logger;
        private readonly IHostEnvironment _env;

        public SecureErrorHandlingMiddleware(
            RequestDelegate next,
            ILogger<SecureErrorHandlingMiddleware> logger,
            IHostEnvironment env)
        {
            _next = next;
            _logger = logger;
            _env = env;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An unhandled exception occurred");
                await HandleExceptionAsync(context, ex);
            }
        }

    private Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

        var jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        // Security fix: Never expose sensitive error information
        object response;

        // Only in Development: Include detailed error information
        if (_env.IsDevelopment())
        {
            response = new
            {
                error = "An internal server error occurred",
                message = exception.Message,
                stackTrace = exception.StackTrace,
                innerException = exception.InnerException?.Message,
                timestamp = DateTime.UtcNow,
                requestId = context.TraceIdentifier
            };
        }
        else
        {
            response = new
            {
                error = "An internal server error occurred",
                message = "Please try again later or contact support if the problem persists.",
                timestamp = DateTime.UtcNow,
                requestId = context.TraceIdentifier
            };
        }

        return context.Response.WriteAsJsonAsync(response, jsonOptions);
    }
    }
}

