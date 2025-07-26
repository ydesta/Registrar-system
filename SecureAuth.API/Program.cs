using SecureAuth.API.DependencyInjection;
using SecureAuth.APPLICATION.DependencyInjection;
using SecureAuth.INFRASTRUCTURE.DependencyInjection;
using SecureAuth.INFRASTRUCTURE.Services;
using SecureAuth.API.Middleware;

var builder = WebApplication.CreateBuilder(args);

// Configure Kestrel for better performance and timeout handling
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxConcurrentConnections = 200;
    options.Limits.MaxConcurrentUpgradedConnections = 200;
    options.Limits.MaxRequestBodySize = 10 * 1024 * 1024; // 10MB
    options.Limits.KeepAliveTimeout = TimeSpan.FromMinutes(5);
    options.Limits.RequestHeadersTimeout = TimeSpan.FromSeconds(60);
    options.Limits.MaxRequestBufferSize = 1024 * 1024; // 1MB
    options.Limits.MaxResponseBufferSize = 1024 * 1024; // 1MB
});

// Add services using extension methods
builder.Services.AddInfrastructureServices(builder.Configuration);
builder.Services.AddApplicationServices();
builder.Services.AddApplicationValidators();
builder.Services.AddConfigurationServices(builder.Configuration);
builder.Services.AddApiServices();

// Configure HTTP client with extended timeout
builder.Services.AddHttpClient("default", client =>
{
    client.Timeout = TimeSpan.FromSeconds(60);
    client.DefaultRequestHeaders.Add("User-Agent", "SecureAuth-API/1.0");
});

var app = builder.Build();

// Seed database with extended timeout
using (var scope = app.Services.CreateScope())
{
    try
    {
        var seedService = scope.ServiceProvider.GetRequiredService<DatabaseSeedService>();
        await seedService.SeedDatabaseAsync();
    }
    catch (Exception ex)
    {
        var logger = app.Services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Database seeding failed");
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "SecureAuth API v1");
        c.RoutePrefix = "swagger"; 
        c.DocumentTitle = "SecureAuth API Documentation";
        c.DefaultModelsExpandDepth(-1); 
        c.DisplayRequestDuration();
        c.DocExpansion(Swashbuckle.AspNetCore.SwaggerUI.DocExpansion.None);
    });
}

// Add CORS middleware before other middleware
app.UseCors("AllowAngularApp");

// Add custom middleware
app.UseMiddleware<CorsDebugMiddleware>();
app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseMiddleware<RateLimitingMiddleware>();

// Add HTTPS redirection for production
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Add global exception handler with extended timeout handling
app.Use(async (context, next) =>
{
    var cts = new CancellationTokenSource(TimeSpan.FromSeconds(60)); // 60 second timeout
    
    try
    {
        context.RequestAborted = CancellationTokenSource.CreateLinkedTokenSource(
            context.RequestAborted, cts.Token).Token;
        
        await next();
    }
    catch (OperationCanceledException)
    {
        context.Response.StatusCode = 504;
        await context.Response.WriteAsJsonAsync(new { 
            error = "Request timeout", 
            message = "The request took too long to process. Please try again.",
            timestamp = DateTime.UtcNow
        });
    }
    catch (Exception ex)
    {
        // Log the exception
        var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An unhandled exception occurred");
        
        context.Response.StatusCode = 500;
        await context.Response.WriteAsJsonAsync(new { 
            error = "An internal server error occurred",
            message = "Please try again later or contact support if the problem persists.",
            timestamp = DateTime.UtcNow
        });
    }
    finally
    {
        cts.Dispose();
    }
});

app.Run();
