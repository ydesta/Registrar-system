using Microsoft.Extensions.DependencyInjection;
using Microsoft.OpenApi.Models;

namespace SecureAuth.API.DependencyInjection
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddApiServices(this IServiceCollection services)
        {
            // Add controllers
            services.AddControllers();

            // Add API Explorer
            services.AddEndpointsApiExplorer();

            // Add Antiforgery services
            services.AddAntiforgery();

            // Add HttpContextAccessor for accessing current user context
            services.AddHttpContextAccessor();

            // Add Swagger
            services.AddSwaggerGen(option =>
            {
                option.SwaggerDoc("v1", new OpenApiInfo 
                { 
                    Title = "SecureAuth API", 
                    Version = "v1",
                    Description = "A secure authentication and authorization API with JWT tokens",
                    Contact = new OpenApiContact
                    {
                        Name = "API Support",
                        Email = "support@secureauth.com"
                    }
                });

                // Configure JWT Bearer authentication
                option.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Description = @"JWT Authorization header using the Bearer scheme. 
                                  Enter 'Bearer' [space] and then your token in the text input below.
                                  Example: 'Bearer 12345abcdef'",
                    Name = "Authorization",
                    In = ParameterLocation.Header,
                    Type = SecuritySchemeType.ApiKey,
                    Scheme = "Bearer"
                });

                // Make sure Swagger UI requires a Bearer token to be passed
                option.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "Bearer"
                            }
                        },
                        new string[] {}
                    }
                });

                // Include XML comments if available
                var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
                var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
                if (File.Exists(xmlPath))
                {
                    option.IncludeXmlComments(xmlPath);
                }
            });

            return services;
        }
    }
} 