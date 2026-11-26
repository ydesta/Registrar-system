using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SecureAuth.APPLICATION.Commands.Auth;
using SecureAuth.APPLICATION.DTOs.Authentication;
using SecureAuth.APPLICATION.Helpers;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.DOMAIN.Models;
using SecureAuth.DOMAIN.Models.Security;

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
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ILogger<LoginCommandHandler> _logger;

        public LoginCommandHandler(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            ISecureTokenService tokenService,
            IUnitOfWork unitOfWork,
            IActivityLogService activityLogService,
            IOtpService otpService,
            IRolePermissionRepository rolePermissionRepository,
            ISecurityEventService securityEventService,
            IHttpContextAccessor httpContextAccessor,
            ILogger<LoginCommandHandler> logger)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _tokenService = tokenService;
            _unitOfWork = unitOfWork;
            _activityLogService = activityLogService;
            _otpService = otpService;
            _rolePermissionRepository = rolePermissionRepository;
            _securityEventService = securityEventService;
            _httpContextAccessor = httpContextAccessor;
            _logger = logger;
        }

        private string GetClientIpAddress()
        {
            try
            {
                var ip = _httpContextAccessor.HttpContext?.Connection?.RemoteIpAddress?.ToString();
                return ip ?? "127.0.0.1"; // Fallback to localhost if unable to get IP
            }
            catch
            {
                return "127.0.0.1";
            }
        }

        private string GetUserAgent()
        {
            try
            {
                var userAgent = _httpContextAccessor.HttpContext?.Request?.Headers["User-Agent"].ToString();
                return userAgent ?? "Unknown";
            }
            catch
            {
                return "Unknown";
            }
        }

        public async Task<LoginResponse> HandleAsync(LoginCommand command)
        {
            try
            {
                // Validate command
                if (command == null)
                {
                    return new LoginResponse
                    {
                        Success = false,
                        Message = "Invalid login command",
                        Token = null,
                        RefreshToken = null
                    };
                }

                if (string.IsNullOrWhiteSpace(command.Email) || string.IsNullOrWhiteSpace(command.Password))
                {
                    return new LoginResponse
                    {
                        Success = false,
                        Message = "Email and password are required",
                        Token = null,
                        RefreshToken = null
                    };
                }

                var user = await _userManager.FindByEmailAsync(command.Email.Trim().ToLowerInvariant());
            if (user == null)
            {
                // Record failed login attempt for non-existent user
                await _securityEventService.RecordFailedLoginAsync(command.Email, GetClientIpAddress(), GetUserAgent(), "User not found");
                
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
                await _securityEventService.RecordLoginAttemptAsync(user.Id, user.Email, false, GetClientIpAddress(), GetUserAgent(), "Account deactivated");
                
                return new LoginResponse
                {
                    Success = false,
                    Message = "Account is deactivated",
                    Token = null,
                    RefreshToken = null
                };
            }

            // Auto-unlock if previous lockout has expired
            if (user.LockoutEnd.HasValue && user.LockoutEnd.Value <= DateTimeOffset.UtcNow)
            {
                await _unitOfWork.Users.UnlockUserAsync(user.Id);
                user.LockoutEnd = null;
                user.FailedLoginAttempts = 0;
            }

            // Check if user is currently locked out
            if (user.LockoutEnd.HasValue && user.LockoutEnd.Value > DateTimeOffset.UtcNow)
            {
                await _securityEventService.RecordLoginAttemptAsync(user.Id, user.Email, false, GetClientIpAddress(), GetUserAgent(), "Account locked");

                var now = DateTimeOffset.UtcNow;
                var lockoutEnd = user.LockoutEnd.Value;
                var remainingMinutes = Math.Max(1, (int)Math.Ceiling(lockoutEnd.Subtract(now).TotalMinutes));
                var lockoutMessage = $"Account is temporarily locked due to multiple failed login attempts. Please try again in {remainingMinutes} minute{(remainingMinutes == 1 ? "" : "s")}.";

                return new LoginResponse
                {
                    Success = false,
                    Message = lockoutMessage,
                    Token = null,
                    RefreshToken = null,
                    IsLocked = true,
                    LockoutEnd = lockoutEnd.DateTime,
                    RemainingAttempts = 0
                };
            }

            const int maxLoginAttempts = 5;
            const int lockoutDurationMinutes = 15;

            // Verify password
            var passwordResult = await _signInManager.CheckPasswordSignInAsync(user, command.Password, false);
            if (!passwordResult.Succeeded)
            {
                var newAttemptCount = user.FailedLoginAttempts + 1;
                var remainingAttempts = Math.Max(0, maxLoginAttempts - newAttemptCount);

                await _unitOfWork.Users.IncrementFailedLoginAttemptsAsync(user.Id);
                await _unitOfWork.SaveChangesAsync();
                user.FailedLoginAttempts = newAttemptCount;

                if (newAttemptCount >= maxLoginAttempts)
                {
                    var lockoutEnd = DateTimeOffset.UtcNow.AddMinutes(lockoutDurationMinutes);
                    await _unitOfWork.Users.LockUserAsync(user.Id, lockoutEnd);

                    await _securityEventService.RecordLoginAttemptAsync(user.Id, user.Email, false, GetClientIpAddress(), GetUserAgent(), "Invalid password - account locked");

                    return new LoginResponse
                    {
                        Success = false,
                        Message = $"Too many failed login attempts. Your account has been locked for {lockoutDurationMinutes} minutes for security reasons.",
                        Token = null,
                        RefreshToken = null,
                        IsLocked = true,
                        LockoutEnd = lockoutEnd.DateTime,
                        RemainingAttempts = 0
                    };
                }

                await _securityEventService.RecordLoginAttemptAsync(user.Id, user.Email, false, GetClientIpAddress(), GetUserAgent(), "Invalid password");

                string message = remainingAttempts > 0
                    ? $"Invalid email or password. {remainingAttempts} attempt(s) remaining before account is locked."
                    : "Invalid email or password";

                return new LoginResponse
                {
                    Success = false,
                    Message = message,
                    Token = null,
                    RefreshToken = null,
                    RemainingAttempts = remainingAttempts
                };
            }

            // Check if email is confirmed - TEMPORARILY DISABLED FOR TESTING
            // if (!user.EmailConfirmed)
            // {
            //     await _securityEventService.RecordLoginAttemptAsync(user.Id, user.Email, false, GetClientIpAddress(), GetUserAgent(), "Email not confirmed");
            //     
            //     return new LoginResponse
            //     {
            //         Success = false,
            //         Message = "Please verify your email address before logging in. Check your email for a verification link.",
            //         Token = null,
            //         RefreshToken = null
            //     };
            // }

            // Check if 2FA is required (by user OR by role)
            bool isTwoFactorRequired = false;
            
            // Check if user has 2FA enabled
            if (user.TwoFactorEnabled)
            {
                isTwoFactorRequired = true;
            }
            else
            {
                // Check if user's role requires 2FA
                var userRoles = await _userManager.GetRolesAsync(user);
                
                foreach (var roleName in userRoles)
                {
                    var role = await _unitOfWork.Roles.GetByNameAsync(roleName);
                    if (role != null && role.RequiresTwoFactor)
                    {
                        isTwoFactorRequired = true;
                        break;
                    }
                }
            }
            
            if (isTwoFactorRequired && string.IsNullOrEmpty(command.TwoFactorCode))
            {
                try
                {
                    await _otpService.GenerateOtpAsync(user.Id, user.Email, "Login");
                }
                catch (Exception)
                {
                    return new LoginResponse
                    {
                        Success = false,
                        Message = "The verification code email could not be sent. Please try again.",
                        Token = null,
                        RefreshToken = null
                    };
                }

                // Success=true so Angular shows OTP form (not error handler)
                return new LoginResponse
                {
                    Success = true,
                    Message = "Two-factor authentication required. Please check your email for the verification code.",
                    RequiresTwoFactor = true,
                    Token = null,
                    RefreshToken = null
                };
            }

            // Verify 2FA if provided and required
            if (isTwoFactorRequired && !string.IsNullOrEmpty(command.TwoFactorCode))
            {
                var otpValid = await _otpService.VerifyOtpAsync(user.Id, command.TwoFactorCode, "Login");
                if (!otpValid)
                {
                    await _securityEventService.RecordLoginAttemptAsync(user.Id, user.Email, false, GetClientIpAddress(), GetUserAgent(), "Invalid OTP");
                    
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

            // Get user roles and permissions in a single optimized call
            var userLoginData = await _rolePermissionRepository.GetUserLoginDataAsync(user.Id);

            // Log successful login
            await _activityLogService.LogUserActionAsync(
                user.Id,
                "UserLogin",
                "User",
                user.Id,
                "User logged in successfully");

            // Record successful login in security events
            await _securityEventService.RecordLoginAttemptAsync(user.Id, user.Email, true, GetClientIpAddress(), GetUserAgent());

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
                    PhoneNumber = EthiopianPhoneNumber.NormalizeOptional(user.PhoneNumber),
                    EmailConfirmed = user.EmailConfirmed,
                    PhoneNumberConfirmed = user.PhoneNumberConfirmed,
                    TwoFactorEnabled = user.TwoFactorEnabled,
                    IsActive = user.IsActive,
                    CreatedAt = user.CreatedAt,
                    LastLoginAt = user.LastLoginAt,
                    Roles = userLoginData.UserRoles
                },
                Permissions = new UserPermissions
                {
                    Permissions = userLoginData.UserPermissions,
                    RolePermissions = userLoginData.RolePermissions,
                    IsSuperAdmin = userLoginData.IsSuperAdmin,
                    HasAdminAccess = userLoginData.HasAdminAccess
                }
            };
            }
            catch (Exception ex)
            {
                // Log the exception with full details for debugging
                _logger.LogError(ex, "Login error for email: {Email}, IP: {IpAddress}, UserAgent: {UserAgent}", 
                    command?.Email ?? "unknown", 
                    GetClientIpAddress(), 
                    GetUserAgent());
                
                // Log inner exception if present
                if (ex.InnerException != null)
                {
                    _logger.LogError(ex.InnerException, "Inner exception during login for email: {Email}", 
                        command?.Email ?? "unknown");
                }
                
                // Return a user-friendly error message while logging the actual error
                return new LoginResponse
                {
                    Success = false,
                    Message = "An internal error occurred during login. Please try again later.",
                    Token = null,
                    RefreshToken = null
                };
            }
        }
    }
} 
