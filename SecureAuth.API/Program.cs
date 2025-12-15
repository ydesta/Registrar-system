using SecureAuth.API.DependencyInjection;
using SecureAuth.APPLICATION.DependencyInjection;
using SecureAuth.INFRASTRUCTURE.DependencyInjection;
using SecureAuth.INFRASTRUCTURE.Services;
using SecureAuth.API.Middleware;
using SecureAuth.API.Configuration;

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

// Override configuration values from constants (auto-selects dev or prod)
builder.Configuration["ConnectionStrings:DefaultConnection"] = AppConstants.Database.ConnectionString;
builder.Configuration["JWT:ValidAudience"] = AppConstants.Jwt.ValidAudience;
builder.Configuration["JWT:ValidIssuer"] = AppConstants.Jwt.ValidIssuer;
builder.Configuration["JWT:Secret"] = AppConstants.Jwt.Secret;
builder.Configuration["AppSettings:FrontendUrl"] = AppConstants.AppSettings.FrontendUrl;
builder.Configuration["EmailConfiguration:From"] = AppConstants.Email.From;
builder.Configuration["EmailConfiguration:SmtpServer"] = AppConstants.Email.SmtpServer;
builder.Configuration["EmailConfiguration:Port"] = AppConstants.Email.Port.ToString();
builder.Configuration["EmailConfiguration:Username"] = AppConstants.Email.Username;
builder.Configuration["EmailConfiguration:Password"] = AppConstants.Email.Password;
builder.Configuration["EmailConfiguration:BaseUrl"] = AppConstants.Email.BaseUrl;
builder.Configuration["RateLimiting:MaxAttempts"] = AppConstants.RateLimiting.MaxAttempts.ToString();
builder.Configuration["RateLimiting:TimeWindowMinutes"] = AppConstants.RateLimiting.TimeWindowMinutes.ToString();
builder.Configuration["TokenPolicy:AccessTokenValidity"] = AppConstants.TokenPolicy.AccessTokenValidity.ToString();
builder.Configuration["TokenPolicy:RefreshTokenValidity"] = AppConstants.TokenPolicy.RefreshTokenValidity.ToString();
builder.Configuration["TokenPolicy:RequireRefreshTokenRotation"] = AppConstants.TokenPolicy.RequireRefreshTokenRotation.ToString();
builder.Configuration["PasswordPolicy:MinLength"] = AppConstants.PasswordPolicy.MinLength.ToString();
builder.Configuration["PasswordPolicy:RequireUppercase"] = AppConstants.PasswordPolicy.RequireUppercase.ToString();
builder.Configuration["PasswordPolicy:RequireLowercase"] = AppConstants.PasswordPolicy.RequireLowercase.ToString();
builder.Configuration["PasswordPolicy:RequireDigit"] = AppConstants.PasswordPolicy.RequireDigit.ToString();
builder.Configuration["PasswordPolicy:RequireSpecialCharacter"] = AppConstants.PasswordPolicy.RequireSpecialCharacter.ToString();
builder.Configuration["PasswordPolicy:PasswordHistorySize"] = AppConstants.PasswordPolicy.PasswordHistorySize.ToString();
builder.Configuration["PasswordPolicy:MaxAgeDays"] = AppConstants.PasswordPolicy.MaxAgeDays.ToString();
builder.Configuration["Security:FrontendClientKey"] = AppConstants.Security.FrontendClientKey;

// Set CORS configuration from AppConstants
var corsOrigins = AppConstants.Cors.AllowedOrigins;
var corsMethods = AppConstants.Cors.AllowedMethods;
var corsHeaders = AppConstants.Cors.AllowedHeaders;

// Set CORS configuration in IConfiguration for ServiceCollectionExtensions to read
// Use indexed format for array binding
for (int i = 0; i < corsOrigins.Length; i++)
{
    builder.Configuration[$"Cors:AllowedOrigins:{i}"] = corsOrigins[i];
}
for (int i = 0; i < corsMethods.Length; i++)
{
    builder.Configuration[$"Cors:AllowedMethods:{i}"] = corsMethods[i];
}
for (int i = 0; i < corsHeaders.Length; i++)
{
    builder.Configuration[$"Cors:AllowedHeaders:{i}"] = corsHeaders[i];
}

// Log which environment is being used
var loggerFactory = LoggerFactory.Create(config => config.AddConsole());
var logger = loggerFactory.CreateLogger<Program>();
logger.LogInformation("Starting application in {Environment} mode", AppConstants.Environment.CurrentEnvironment);
logger.LogInformation("CORS Origins configured: {Origins}", string.Join(", ", AppConstants.Cors.AllowedOrigins));
logger.LogInformation("CORS Methods configured: {Methods}", string.Join(", ", AppConstants.Cors.AllowedMethods));
logger.LogInformation("CORS Headers configured: {Headers}", string.Join(", ", AppConstants.Cors.AllowedHeaders));

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

// Configure HTTP client with extended timeout - REMOVED SSL BYPASS
builder.Services.AddHttpClient("default", client =>
{
    client.Timeout = TimeSpan.FromSeconds(60);
    client.DefaultRequestHeaders.Add("User-Agent", "SecureAuth-API/1.0");
});
// REMOVED: SSL certificate validation bypass - use valid certificates instead

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
        var seedLogger = app.Services.GetRequiredService<ILogger<Program>>();
        seedLogger.LogError(ex, "Database seeding failed");
    }
}

// Configure the HTTP request pipeline.
var shouldEnableSwagger = app.Environment.IsDevelopment() && AppConstants.Swagger.Enabled;

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

// IMPORTANT: FrontendRequestValidation must come after CORS to allow preflight requests
app.UseMiddleware<FrontendRequestValidationMiddleware>();

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
