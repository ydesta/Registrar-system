using Microsoft.AspNetCore.Identity;
using SecureAuth.APPLICATION.DTOs.Authentication;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.DOMAIN.Models;

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

        public VerifyOtpCommandHandler(
            IOtpService otpService,
            UserManager<ApplicationUser> userManager,
            ISecureTokenService tokenService,
            IRolePermissionRepository rolePermissionRepository,
            IActivityLogService activityLogService,
            ISecurityEventService securityEventService)
        {
            _otpService = otpService;
            _userManager = userManager;
            _tokenService = tokenService;
            _rolePermissionRepository = rolePermissionRepository;
            _activityLogService = activityLogService;
            _securityEventService = securityEventService;
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

            // Generate tokens for successful verification
            var token = await _tokenService.GenerateAccessTokenAsync(user);
            var refreshToken = await _tokenService.GenerateRefreshTokenAsync();

            // Get user roles and permissions
            var userRoles = await _rolePermissionRepository.GetUserRolesAsync(user.Id);
            var userPermissions = await _rolePermissionRepository.GetUserPermissionsAsync(user.Id);
            var rolePermissions = await _rolePermissionRepository.GetUserRolePermissionsAsync(user.Id);
            var isSuperAdmin = await _rolePermissionRepository.IsSuperAdminAsync(user.Id);
            var hasAdminAccess = await _rolePermissionRepository.HasAdminAccessAsync(user.Id);

            // Log successful OTP verification
            await _activityLogService.LogUserActionAsync(
                user.Id,
                "OtpVerification",
                "User",
                user.Id,
                $"OTP verified successfully for {command.Purpose}");

            // Record successful login in security events
            await _securityEventService.RecordLoginAttemptAsync(user.Id, user.Email, true, "127.0.0.1", "Unknown");

            return new OtpVerifyResponse
            {
                Success = true,
                Message = "OTP verified successfully.",
                OtpVerified = true,
                Purpose = command.Purpose,
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
