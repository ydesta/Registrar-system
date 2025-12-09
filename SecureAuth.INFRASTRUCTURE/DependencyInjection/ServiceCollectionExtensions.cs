using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using SecureAuth.APPLICATION.Commands;
using SecureAuth.APPLICATION.Commands.Auth;
using SecureAuth.APPLICATION.Commands.Admin;
using SecureAuth.APPLICATION.Commands.Security;
using SecureAuth.APPLICATION.Commands.User;
using SecureAuth.APPLICATION.DTOs.Authentication;
using SecureAuth.APPLICATION.DTOs.User;
using SecureAuth.APPLICATION.DTOs.Admin;
using SecureAuth.APPLICATION.DTOs.Security;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.APPLICATION.Mediator;
using SecureAuth.APPLICATION.Queries;
using SecureAuth.APPLICATION.Queries.Auth;
using SecureAuth.APPLICATION.Queries.Admin;
using SecureAuth.APPLICATION.Queries.Security;
using SecureAuth.APPLICATION.Queries.User;
using SecureAuth.APPLICATION.Services;
using SecureAuth.APPLICATION.Services.Security;
using SecureAuth.DOMAIN.Models;
using SecureAuth.DOMAIN.Models.Security;
using SecureAuth.INFRASTRUCTURE.Data;
using SecureAuth.INFRASTRUCTURE.Services;
using SecureAuth.INFRASTRUCTURE.Services.Repositories;
using SecureAuth.INFRASTRUCTURE.Services.Security;
using System.Text;
using System.Security.Claims;
using SecureAuth.APPLICATION.DTOs;

namespace SecureAuth.INFRASTRUCTURE.DependencyInjection
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddInfrastructureServices(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            // Add CORS Policy - More restrictive configuration
            services.AddCors(options =>
            {
                options.AddPolicy("AllowAngularApp", policy =>
                {
                    policy
                        .WithOrigins(
                            "https://hilcoe.edu.et",           // Production domain
                            "https://staging.hilcoe.edu.et",    // Staging subdomain
                            "https://hsis.hilcoe.edu.et"        // Production domain
                        )
                        .WithMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .WithHeaders("Content-Type", "Authorization", "X-Requested-With", "X-CSRF-TOKEN")
                        .AllowCredentials()
                        .WithExposedHeaders("X-Pagination", "X-Total-Count");
                        
                    // Development environment - more permissive
                    if (Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development")
                    {
                        policy
                            .WithOrigins(
                                "http://localhost:4200",     // Angular dev server
                                "https://localhost:4200",    // Angular dev server HTTPS
                                "http://localhost:4201",     // Alternative Angular port
                                "https://localhost:4201"     // Alternative Angular port HTTPS
                            );
                    }
                });
            });

            // Add DbContext
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));

            // Add Identity
            services.AddIdentity<ApplicationUser, ApplicationRole>(options =>
            {
                // Password settings
                options.Password.RequireDigit = true;
                options.Password.RequiredLength = 8;

                // Lockout settings
                options.Lockout.MaxFailedAccessAttempts = 5;
                options.Lockout.AllowedForNewUsers = true;

                // User settings
                options.User.RequireUniqueEmail = true;
            })
            .AddEntityFrameworkStores<ApplicationDbContext>()
            .AddDefaultTokenProviders();

            // Configure Identity options
            services.Configure<Microsoft.AspNetCore.Identity.IdentityOptions>(
                opts => opts.SignIn.RequireConfirmedEmail = true);

            services.Configure<Microsoft.AspNetCore.Identity.DataProtectionTokenProviderOptions>(
                opts => opts.TokenLifespan = TimeSpan.FromHours(10));

            // Add JWT Authentication
            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
            }).AddJwtBearer(options =>
            {
                options.SaveToken = true;
                options.RequireHttpsMetadata = false;
                options.TokenValidationParameters = new TokenValidationParameters()
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ClockSkew = TimeSpan.Zero,

                    ValidAudience = configuration["JWT:ValidAudience"],
                    ValidIssuer = configuration["JWT:ValidIssuer"],
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["JWT:Secret"])),
                    
                    // Configure claim types for proper role mapping
                    NameClaimType = ClaimTypes.Name,
                    RoleClaimType = ClaimTypes.Role
                };
            });

            // Configure security policies
            services.Configure<RateLimitingPolicy>(configuration.GetSection("RateLimiting"));
            services.Configure<TokenPolicy>(configuration.GetSection("TokenPolicy"));
            services.Configure<PasswordPolicy>(configuration.GetSection("PasswordPolicy"));

            // Register Infrastructure Services
            services.AddScoped<IEmailService, EmailService>();
            services.AddScoped<EmailTemplateService>(provider => 
                new EmailTemplateService(configuration["AppSettings:FrontendUrl"] ?? "http://localhost:4200"));
            services.AddScoped<ISecureTokenService, SecureTokenService>();
            services.AddScoped<ISecurePasswordHasher, SecurePasswordHasher>();
            services.AddScoped<IPasswordValidationService, PasswordValidationService>();
            services.AddSingleton<IRateLimitingService, RateLimitingService>();
            services.AddScoped<IActivityLogService, ActivityLogService>();
            services.AddScoped<IOtpService, OtpService>();
            services.AddScoped<IEmailSender, EmailSenderAdapter>();
            services.AddScoped<IUserProfileService, UserProfileService>();
            services.AddScoped<ISecurityEventService, SecurityEventService>();
            services.AddScoped<ISystemHealthService, SystemHealthService>();
            services.AddScoped<ISecuritySettingsService, SecuritySettingsService>();
            services.AddScoped<ISystemBackupService, SystemBackupService>();
            
            // Register Background Services
            services.AddHostedService<SystemMonitoringBackgroundService>();

            // Register Repositories
            services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
            services.AddScoped<IUserRepository, UserRepository>();
            services.AddScoped<IRoleRepository, RoleRepository>();
            services.AddScoped<IPermissionRepository, PermissionRepository>();
            services.AddScoped<IPasswordHistoryRepository, PasswordHistoryRepository>();
            services.AddScoped<IPasswordResetTokenRepository, PasswordResetTokenRepository>();
            services.AddScoped<IRolePermissionRepository, RolePermissionRepository>();
            services.AddScoped<IUserCredentialRepository, UserCredentialRepository>();
            services.AddScoped<IPasswordPolicyRepository, PasswordPolicyRepository>();
            services.AddScoped<ISystemConfigurationRepository, SystemConfigurationRepository>();
            services.AddScoped<ISystemBackupRepository, SystemBackupRepository>();
            services.AddScoped<IAuditLogRepository, AuditLogRepository>();
            services.AddScoped<IActivityLogRepository, ActivityLogRepository>();
            services.AddScoped<ISecurityEventRepository, SecurityEventRepository>();
            services.AddScoped<ISecurityThreatRepository, SecurityThreatRepository>();
            services.AddScoped<IServiceHealthRepository, ServiceHealthRepository>();
            services.AddScoped<IDatabaseHealthRepository, DatabaseHealthRepository>();
            services.AddScoped<ISystemMetricsRepository, SystemMetricsRepository>();
            services.AddScoped<ISecuritySettingsRepository, SecuritySettingsRepository>();

            // Register Unit of Work
            services.AddScoped<IUnitOfWork, UnitOfWork>();

            // Register DatabaseSeedService
            services.AddScoped<DatabaseSeedService>();

            return services;
        }

        public static IServiceCollection AddApplicationServices(this IServiceCollection services)
        {
            // Register Application Services
            services.AddScoped<IUserManagement, UserManagement>();
            services.AddScoped<IPasswordManagementService, PasswordManagementService>();
            services.AddScoped<SecurityServices>();
            services.AddScoped<PasswordGeneratorService>();
            services.AddScoped<IPasswordGeneratorService, PasswordGeneratorService>();

            // Register Mediator
            services.AddScoped<IMediator, SecureAuth.APPLICATION.Mediator.Mediator>();

            // Register Command Handlers (Auth)
            services.AddScoped<ICommandHandler<LoginCommand, LoginResponse>, LoginCommandHandler>();
            services.AddScoped<ICommandHandler<RegisterCommand, RegisterResponse>, RegisterCommandHandler>();
            services.AddScoped<ICommandHandler<AdminRegisterCommand, RegisterResponse>, AdminRegisterCommandHandler>();
            services.AddScoped<ICommandHandler<AdminCreateUserCommand, AdminCreateUserResponse>, AdminCreateUserCommandHandler>();
            services.AddScoped<ICommandHandler<ForgotPasswordCommand, ForgotPasswordResponse>, ForgotPasswordCommandHandler>();
            services.AddScoped<ICommandHandler<ResetPasswordCommand, ResetPasswordResponse>, ResetPasswordCommandHandler>();
            services.AddScoped<ICommandHandler<VerifyEmailCommand, VerifyEmailResponse>, VerifyEmailCommandHandler>();
            services.AddScoped<ICommandHandler<ResendVerificationCommand, ResendVerificationResponse>, ResendVerificationCommandHandler>();
            services.AddScoped<ICommandHandler<VerifyOtpCommand, OtpVerifyResponse>, VerifyOtpCommandHandler>();
            services.AddScoped<ICommandHandler<ResendOtpCommand, ResendOtpResponse>, ResendOtpCommandHandler>();
            services.AddScoped<ICommandHandler<ChangePasswordCommand, ChangePasswordResponse>, ChangePasswordCommandHandler>();
            services.AddScoped<ICommandHandler<RegeneratePasswordCommand, RegeneratePasswordResult>, RegeneratePasswordCommandHandler>();
            services.AddScoped<ICommandHandler<EnableTwoFactorCommand, EnableTwoFactorResponse>, EnableTwoFactorCommandHandler>();
            services.AddScoped<ICommandHandler<DisableTwoFactorCommand, DisableTwoFactorResponse>, DisableTwoFactorCommandHandler>();

            // Register Command Handlers (Admin)
            services.AddScoped<ICommandHandler<CreateRoleCommand, string>, CreateRoleCommandHandler>();
            services.AddScoped<ICommandHandler<UpdateRoleCommand, bool>, UpdateRoleCommandHandler>();
            services.AddScoped<ICommandHandler<DeleteRoleCommand, bool>, DeleteRoleCommandHandler>();
            services.AddScoped<ICommandHandler<AssignPermissionsToRoleCommand, bool>, AssignPermissionsToRoleCommandHandler>();
            services.AddScoped<ICommandHandler<RemovePermissionsFromRoleCommand, bool>, RemovePermissionsFromRoleCommandHandler>();

            // Register Command Handlers (User)
            services.AddScoped<ICommandHandler<CreateUserCommand, CreateUserCommandResponse>, CreateUserCommandHandler>();
            services.AddScoped<ICommandHandler<UpdateUserCommand, bool>, UpdateUserCommandHandler>();
            services.AddScoped<ICommandHandler<UpdateEmailCommand, UpdateEmailResponse>, UpdateEmailCommandHandler>();
            services.AddScoped<ICommandHandler<AdminUpdateEmailCommand, UpdateEmailResponse>, AdminUpdateEmailCommandHandler>();
            services.AddScoped<ICommandHandler<DeleteUserCommand, bool>, DeleteUserCommandHandler>();
            services.AddScoped<ICommandHandler<UpdateUserStatusCommand, bool>, UpdateUserStatusCommandHandler>();
            services.AddScoped<ICommandHandler<UpdateUserRoleCommand, Result>, UpdateUserRoleCommandHandler>();

            // Register Command Handlers (Security)
            services.AddScoped<ICommandHandler<BlockUserCommand, BlockUserResultModel>, BlockUserCommandHandler>();
            services.AddScoped<ICommandHandler<UnblockUserCommand, UnblockUserResultModel>, UnblockUserCommandHandler>();
            services.AddScoped<ICommandHandler<UpdatePasswordPolicyCommand, bool>, UpdatePasswordPolicyCommandHandler>();
            services.AddScoped<ICommandHandler<UpdateSecuritySettingsCommand, bool>, UpdateSecuritySettingsCommandHandler>();
            services.AddScoped<ICommandHandler<CreateSecurityThreatCommand, SecurityThreatModel>, CreateSecurityThreatCommandHandler>();
            services.AddScoped<ICommandHandler<UpdateSecurityThreatCommand, SecurityThreatModel>, UpdateSecurityThreatCommandHandler>();
            services.AddScoped<ICommandHandler<DeleteSecurityThreatCommand, bool>, DeleteSecurityThreatCommandHandler>();

            // Register Query Handlers (Auth)
            services.AddScoped<IQueryHandler<GetUserProfileQuery, UserProfileResponse>, GetUserProfileQueryHandler>();
            services.AddScoped<IQueryHandler<GetTwoFactorSetupQuery, TwoFactorSetupModel>, GetTwoFactorSetupQueryHandler>();

            // Register Query Handlers (Admin)
            services.AddScoped<IQueryHandler<GetRolesQuery, List<RoleModel>>, GetRolesQueryHandler>();
            services.AddScoped<IQueryHandler<GetRoleByIdQuery, RoleModel>, GetRoleByIdQueryHandler>();
            services.AddScoped<IQueryHandler<GetRolePermissionsQuery, List<PermissionModel>>, GetRolePermissionsQueryHandler>();
            services.AddScoped<IQueryHandler<GetPermissionsQuery, List<PermissionModel>>, GetPermissionsQueryHandler>();
            services.AddScoped<IQueryHandler<GetSystemConfigurationQuery, SystemConfigurationModel>, GetSystemConfigurationQueryHandler>();
            services.AddScoped<IQueryHandler<GetSystemHealthQuery, SystemHealthModel>, GetSystemHealthQueryHandler>();
            services.AddScoped<IQueryHandler<GetSystemStatisticsQuery, SystemStatisticsModel>, GetSystemStatisticsQueryHandler>();
            services.AddScoped<IQueryHandler<GetAuditLogsQuery, List<AuditLogModel>>, GetAuditLogsQueryHandler>();
            services.AddScoped<IQueryHandler<GetAuditLogByIdQuery, AuditLogModel>, GetAuditLogByIdQueryHandler>();
            services.AddScoped<IQueryHandler<GetActivityLogsQuery, ActivityLogPagedResult>, GetActivityLogsQueryHandler>();
            services.AddScoped<IQueryHandler<GetActivityLogByIdQuery, ActivityLogModel>, GetActivityLogByIdQueryHandler>();

            // Register Query Handlers (User)
            services.AddScoped<IQueryHandler<GetUsersQuery, UsersListResponse>, GetUsersQueryHandler>();
            services.AddScoped<IQueryHandler<GetUserByIdQuery, UserDetailsResponse>, GetUserByIdQueryHandler>();
            services.AddScoped<IQueryHandler<GetUserCredentialsQuery, GetUserCredentialsResponse>, GetUserCredentialsQueryHandler>();

            // Register Query Handlers (Security)
            services.AddScoped<IQueryHandler<GetSecuritySettingsQuery, SecuritySettingsModel>, GetSecuritySettingsQueryHandler>();
            services.AddScoped<IQueryHandler<GetSecurityThreatsQuery, List<SecurityThreatModel>>, GetSecurityThreatsQueryHandler>();
            services.AddScoped<IQueryHandler<GetUserSecurityStatusQuery, UserSecurityStatusModel>, GetUserSecurityStatusQueryHandler>();
            services.AddScoped<IQueryHandler<GetPasswordPolicyQuery, PasswordPolicyModel>, GetPasswordPolicyQueryHandler>();

            return services;
        }

        public static IServiceCollection AddConfigurationServices(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            // Add Email Configuration
            var emailConfig = configuration.GetSection("EmailConfiguration").Get<EmailConfiguration>();
            if (emailConfig != null)
            {
                services.AddSingleton(emailConfig);
            }

            return services;
        }
    }
} 