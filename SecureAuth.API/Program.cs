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
    
    // Security: Remove server header to prevent information disclosure
    options.AddServerHeader = false;
});

// Add services using extension methods
builder.Services.AddInfrastructureServices(builder.Configuration);
builder.Services.AddApplicationServices();
builder.Services.AddApplicationValidators();
builder.Services.AddConfigurationServices(builder.Configuration);
builder.Services.AddApiServices();

// Configure HSTS with proper settings
builder.Services.AddHsts(x =>
{
    x.Preload = true;
    x.IncludeSubDomains = true;
    x.MaxAge = TimeSpan.FromDays(365); // 1 year (31536000 seconds)
    
    // Exclude localhost and HTTP endpoints during development
    if (builder.Environment.IsDevelopment())
    {
        x.ExcludedHosts.Add("localhost");
        x.ExcludedHosts.Add("127.0.0.1");
    }
});

// Configure HTTP client with extended timeout and SSL bypass
builder.Services.AddHttpClient("default", client =>
{
    client.Timeout = TimeSpan.FromSeconds(60);
    client.DefaultRequestHeaders.Add("User-Agent", "SecureAuth-API/1.0");
}).ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
{
    ServerCertificateCustomValidationCallback = (sender, cert, chain, sslPolicyErrors) => true,
    CheckCertificateRevocationList = false
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
var swaggerEnabled = app.Configuration.GetValue<bool>("SwaggerSettings:Enabled", false);
var shouldEnableSwagger = app.Environment.IsDevelopment() && swaggerEnabled;

if (shouldEnableSwagger)
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

// Security fix: Use secure error handling middleware instead of inline handler
app.UseMiddleware<SecureErrorHandlingMiddleware>();

// Add custom middleware
app.UseMiddleware<CorsDebugMiddleware>();
app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseMiddleware<RateLimitingMiddleware>();

// Add HTTPS redirection - required for HSTS
if (app.Environment.IsProduction())
{
    app.UseHttpsRedirection();
}

// Enable HSTS middleware in all environments
app.UseHsts();

app.UseAuthentication();
app.UseAntiforgery();
app.UseAuthorization();

app.MapControllers();

app.Run();
