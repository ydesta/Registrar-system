using Microsoft.AspNetCore.Identity;
using SecureAuth.APPLICATION.Commands.Auth;
using SecureAuth.APPLICATION.DTOs.Authentication;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.DOMAIN.Models;

namespace SecureAuth.APPLICATION.Commands.Auth
{
    public class LoginCommandHandler : ICommandHandler<LoginCommand, LoginResponse>
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly ISecureTokenService _tokenService;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IActivityLogService _activityLogService;
        private readonly IOtpService _otpService;
        private readonly IRolePermissionRepository _rolePermissionRepository;
        private readonly ISecurityEventService _securityEventService;

        public LoginCommandHandler(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            ISecureTokenService tokenService,
            IUnitOfWork unitOfWork,
            IActivityLogService activityLogService,
            IOtpService otpService,
            IRolePermissionRepository rolePermissionRepository,
            ISecurityEventService securityEventService)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _tokenService = tokenService;
            _unitOfWork = unitOfWork;
            _activityLogService = activityLogService;
            _otpService = otpService;
            _rolePermissionRepository = rolePermissionRepository;
            _securityEventService = securityEventService;
        }

        public async Task<LoginResponse> HandleAsync(LoginCommand command)
        {
            var user = await _userManager.FindByEmailAsync(command.Email);
            if (user == null)
            {
                // Record failed login attempt for non-existent user
                await _securityEventService.RecordFailedLoginAsync(command.Email, "127.0.0.1", "Unknown", "User not found");
                
                return new LoginResponse
                {
                    Success = false,
                    Message = "Invalid email or password",
                    Token = null,
                    RefreshToken = null
                };
            }

            // Check if user is active
            if (!user.IsActive)
            {
                await _securityEventService.RecordLoginAttemptAsync(user.Id, user.Email, false, "127.0.0.1", "Unknown", "Account deactivated");
                
                return new LoginResponse
                {
                    Success = false,
                    Message = "Account is deactivated",
                    Token = null,
                    RefreshToken = null
                };
            }

            // Check if user is locked out
            if (user.LockoutEnd.HasValue && user.LockoutEnd.Value > DateTime.UtcNow)
            {
                await _securityEventService.RecordLoginAttemptAsync(user.Id, user.Email, false, "127.0.0.1", "Unknown", "Account locked");
                
                return new LoginResponse
                {
                    Success = false,
                    Message = "Account is temporarily locked",
                    Token = null,
                    RefreshToken = null
                };
            }

            // Verify password
            var passwordResult = await _signInManager.CheckPasswordSignInAsync(user, command.Password, false);
            if (!passwordResult.Succeeded)
            {
                await _unitOfWork.Users.IncrementFailedLoginAttemptsAsync(user.Id);
                
                // Check if we should lock the account
                if (user.FailedLoginAttempts >= 5)
                {
                    await _unitOfWork.Users.LockUserAsync(user.Id, DateTime.UtcNow.AddMinutes(15));
                }

                await _unitOfWork.SaveChangesAsync();

                // Record failed login attempt
                await _securityEventService.RecordLoginAttemptAsync(user.Id, user.Email, false, "127.0.0.1", "Unknown", "Invalid password");

                return new LoginResponse
                {
                    Success = false,
                    Message = "Invalid email or password",
                    Token = null,
                    RefreshToken = null
                };
            }

            // Check if email is confirmed
            if (!user.EmailConfirmed)
            {
                await _securityEventService.RecordLoginAttemptAsync(user.Id, user.Email, false, "127.0.0.1", "Unknown", "Email not confirmed");
                
                return new LoginResponse
                {
                    Success = false,
                    Message = "Please verify your email address before logging in. Check your email for a verification link.",
                    Token = null,
                    RefreshToken = null
                };
            }

            // Check if 2FA is required
            if (user.TwoFactorEnabled && string.IsNullOrEmpty(command.TwoFactorCode))
            {
                // Generate and send OTP
                var otp = await _otpService.GenerateOtpAsync(user.Id, user.Email, "Login");
                
                return new LoginResponse
                {
                    Success = false,
                    Message = "Two-factor authentication required. Please check your email for the verification code.",
                    RequiresTwoFactor = true,
                    Token = null,
                    RefreshToken = null
                };
            }

            // Verify 2FA if provided
            if (user.TwoFactorEnabled && !string.IsNullOrEmpty(command.TwoFactorCode))
            {
                var otpValid = await _otpService.VerifyOtpAsync(user.Id, command.TwoFactorCode, "Login");
                if (!otpValid)
                {
                    await _securityEventService.RecordLoginAttemptAsync(user.Id, user.Email, false, "127.0.0.1", "Unknown", "Invalid OTP");
                    
                    return new LoginResponse
                    {
                        Success = false,
                        Message = "Invalid two-factor authentication code. Please try again.",
                        Token = null,
                        RefreshToken = null
                    };
                }
            }

            // Reset failed login attempts
            await _unitOfWork.Users.ResetFailedLoginAttemptsAsync(user.Id);
            await _unitOfWork.Users.UpdateLastLoginAsync(user.Id, DateTime.UtcNow);

            // Generate tokens
            var token = await _tokenService.GenerateAccessTokenAsync(user);
            var refreshToken = await _tokenService.GenerateRefreshTokenAsync();

            // Get user roles and permissions
            var userRoles = await _rolePermissionRepository.GetUserRolesAsync(user.Id);
            var userPermissions = await _rolePermissionRepository.GetUserPermissionsAsync(user.Id);
            var rolePermissions = await _rolePermissionRepository.GetUserRolePermissionsAsync(user.Id);
            var isSuperAdmin = await _rolePermissionRepository.IsSuperAdminAsync(user.Id);
            var hasAdminAccess = await _rolePermissionRepository.HasAdminAccessAsync(user.Id);

            // Log successful login
            await _activityLogService.LogUserActionAsync(
                user.Id,
                "UserLogin",
                "User",
                user.Id,
                "User logged in successfully");

            // Record successful login in security events
            await _securityEventService.RecordLoginAttemptAsync(user.Id, user.Email, true, "127.0.0.1", "Unknown");

            await _unitOfWork.SaveChangesAsync();

            return new LoginResponse
            {
                Success = true,
                Message = "Login successful",
                Token = token,
                RefreshToken = refreshToken,
                User = new UserInfo
                {
                    Id = user.Id,
                    Email = user.Email ?? string.Empty,
                    FirstName = user.FirstName ?? string.Empty,
                    LastName = user.LastName ?? string.Empty,
                    PhoneNumber = user.PhoneNumber,
                    EmailConfirmed = user.EmailConfirmed,
                    PhoneNumberConfirmed = user.PhoneNumberConfirmed,
                    TwoFactorEnabled = user.TwoFactorEnabled,
                    IsActive = user.IsActive,
                    CreatedAt = user.CreatedAt,
                    LastLoginAt = user.LastLoginAt,
                    Roles = userRoles.ToList()
                },
                Permissions = new UserPermissions
                {
                    Permissions = userPermissions.ToList(),
                    RolePermissions = rolePermissions,
                    IsSuperAdmin = isSuperAdmin,
                    HasAdminAccess = hasAdminAccess
                }
            };
        }
    }
} 
