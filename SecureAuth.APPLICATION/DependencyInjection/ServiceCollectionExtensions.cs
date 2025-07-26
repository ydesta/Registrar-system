using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using SecureAuth.APPLICATION.DTOs.Authentication;
using SecureAuth.APPLICATION.Validators;
using SecureAuth.APPLICATION.Commands.Auth;
using SecureAuth.APPLICATION.Services;
using SecureAuth.APPLICATION.Commands;
using SecureAuth.APPLICATION.Commands.User;

namespace SecureAuth.APPLICATION.DependencyInjection
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddApplicationValidators(this IServiceCollection services)
        {
            // Register FluentValidation validators
            services.AddScoped<IValidator<LoginRequest>, LoginRequestValidator>();
            services.AddScoped<IValidator<RegisterRequest>, RegisterRequestValidator>();
            services.AddScoped<IValidator<AdminRegisterRequest>, AdminRegisterRequestValidator>();
            services.AddScoped<IValidator<AdminCreateUserRequest>, AdminCreateUserRequestValidator>();
            services.AddScoped<IValidator<ChangePasswordCommand>, ChangePasswordCommandValidator>();
            services.AddScoped<IPasswordGeneratorService, PasswordGeneratorService>();
            return services;
        }
    }
} 