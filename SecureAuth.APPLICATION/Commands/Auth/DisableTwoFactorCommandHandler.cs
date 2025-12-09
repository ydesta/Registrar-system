using Microsoft.AspNetCore.Identity;
using SecureAuth.APPLICATION.DTOs.Authentication;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.DOMAIN.Models;

namespace SecureAuth.APPLICATION.Commands.Auth
{
    public class DisableTwoFactorCommandHandler : ICommandHandler<DisableTwoFactorCommand, DisableTwoFactorResponse>
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IActivityLogService _activityLogService;
        private readonly ISecurityEventService _securityEventService;

        public DisableTwoFactorCommandHandler(
            UserManager<ApplicationUser> userManager,
            IActivityLogService activityLogService,
            ISecurityEventService securityEventService)
        {
            _userManager = userManager;
            _activityLogService = activityLogService;
            _securityEventService = securityEventService;
        }

        public async Task<DisableTwoFactorResponse> HandleAsync(DisableTwoFactorCommand command)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(command.UserId);
                if (user == null)
                {
                    return new DisableTwoFactorResponse
                    {
                        Success = false,
                        Message = "User not found",
                        TwoFactorEnabled = true
                    };
                }

                // Check if 2FA is disabled
                var isTwoFactorEnabled = await _userManager.GetTwoFactorEnabledAsync(user);
                if (!isTwoFactorEnabled)
                {
                    return new DisableTwoFactorResponse
                    {
                        Success = true,
                        Message = "Two-factor authentication is already disabled",
                        TwoFactorEnabled = false
                    };
                }

                // Optional: Verify code before disabling
                if (!string.IsNullOrEmpty(command.Code))
                {
                    var isValid = await _userManager.VerifyTwoFactorTokenAsync(user, "Email", command.Code);
                    if (!isValid)
                    {
                        return new DisableTwoFactorResponse
                        {
                            Success = false,
                            Message = "Invalid verification code",
                            TwoFactorEnabled = true
                        };
                    }
                }

                // Disable 2FA
                var result = await _userManager.SetTwoFactorEnabledAsync(user, false);
                if (result.Succeeded)
                {
                    await _activityLogService.LogUserActionAsync(
                        user.Id,
                        "Disable2FA",
                        "Security",
                        user.Id,
                        "Two-factor authentication disabled");

                    await _securityEventService.RecordSuspiciousActivityAsync(
                        user.Id,
                        "TwoFactorDisabled",
                        $"Two-factor authentication disabled for user {user.Email}",
                        "127.0.0.1",
                        "System");

                    return new DisableTwoFactorResponse
                    {
                        Success = true,
                        Message = "Two-factor authentication has been disabled successfully",
                        TwoFactorEnabled = false
                    };
                }
                else
                {
                    return new DisableTwoFactorResponse
                    {
                        Success = false,
                        Message = $"Failed to disable two-factor authentication: {string.Join(", ", result.Errors.Select(e => e.Description))}",
                        TwoFactorEnabled = true
                    };
                }
            }
            catch (Exception ex)
            {
                return new DisableTwoFactorResponse
                {
                    Success = false,
                    Message = $"An error occurred: {ex.Message}",
                    TwoFactorEnabled = true
                };
            }
        }
    }
}

