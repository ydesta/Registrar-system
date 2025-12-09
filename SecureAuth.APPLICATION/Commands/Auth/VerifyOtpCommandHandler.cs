using Microsoft.AspNetCore.Identity;
using SecureAuth.APPLICATION.Commands.Auth;
using SecureAuth.APPLICATION.DTOs.Authentication;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.DOMAIN.Models;
using SecureAuth.DOMAIN.Models.Security;
using Microsoft.AspNetCore.Http;

namespace SecureAuth.APPLICATION.Commands.Auth
{
    public class VerifyOtpCommandHandler : ICommandHandler<VerifyOtpCommand, OtpVerifyResponse>
    {
        private readonly IOtpService _otpService;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ISecureTokenService _tokenService;
        private readonly IRolePermissionRepository _rolePermissionRepository;
        private readonly IActivityLogService _activityLogService;
        private readonly ISecurityEventService _securityEventService;
        private readonly IUnitOfWork _unitOfWork;

        public VerifyOtpCommandHandler(
            IOtpService otpService,
            UserManager<ApplicationUser> userManager,
            ISecureTokenService tokenService,
            IRolePermissionRepository rolePermissionRepository,
            IActivityLogService activityLogService,
            ISecurityEventService securityEventService,
            IUnitOfWork unitOfWork)
        {
            _otpService = otpService;
            _userManager = userManager;
            _tokenService = tokenService;
            _rolePermissionRepository = rolePermissionRepository;
            _activityLogService = activityLogService;
            _securityEventService = securityEventService;
            _unitOfWork = unitOfWork;
        }

        public async Task<OtpVerifyResponse> HandleAsync(VerifyOtpCommand command)
        {
            // Find user by email
            var user = await _userManager.FindByEmailAsync(command.Email);
            if (user == null)
            {
                return new OtpVerifyResponse
                {
                    Success = false,
                    Message = "Invalid email address.",
                    OtpVerified = false
                };
            }

            // Verify OTP
            var isValid = await _otpService.VerifyOtpAsync(user.Id, command.OtpCode, command.Purpose);
            if (!isValid)
            {
                await _securityEventService.RecordLoginAttemptAsync(user.Id, user.Email, false, "127.0.0.1", "Unknown", "Invalid OTP");
                
                return new OtpVerifyResponse
                {
                    Success = false,
                    Message = "Invalid or expired verification code. Please try again.",
                    OtpVerified = false
                };
            }

            // ✅ FIX: Reset failed login attempts after successful OTP verification
            await _unitOfWork.Users.ResetFailedLoginAttemptsAsync(user.Id);
            await _unitOfWork.Users.UpdateLastLoginAsync(user.Id, DateTime.UtcNow);

            // Generate tokens for successful verification
            var token = await _tokenService.GenerateAccessTokenAsync(user);
            var refreshToken = await _tokenService.GenerateRefreshTokenAsync();

            // Get user roles and permissions in a single optimized call
            var userLoginData = await _rolePermissionRepository.GetUserLoginDataAsync(user.Id);
            
            // ✅ FIX: Save changes to database
            await _unitOfWork.SaveChangesAsync();

            // Log successful OTP verification
            await _activityLogService.LogUserActionAsync(
                user.Id,
                "OtpVerification",
                "User",
                user.Id,
                "OTP verification successful");

            // Record successful login in security events
            await _securityEventService.RecordLoginAttemptAsync(user.Id, user.Email, true, "127.0.0.1", "Unknown");
            
            // Save any remaining changes (for activity logs and security events)
            await _unitOfWork.SaveChangesAsync();

            return new OtpVerifyResponse
            {
                Success = true,
                Message = "OTP verification successful",
                OtpVerified = true,
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
    }
} 
