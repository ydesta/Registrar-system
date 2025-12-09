using Microsoft.AspNetCore.Identity;
using SecureAuth.APPLICATION.DTOs.Authentication;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.DOMAIN.Models;

namespace SecureAuth.APPLICATION.Commands.Auth
{
    public class EnableTwoFactorCommandHandler : ICommandHandler<EnableTwoFactorCommand, EnableTwoFactorResponse>
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IActivityLogService _activityLogService;
        private readonly ISecurityEventService _securityEventService;

        public EnableTwoFactorCommandHandler(
            UserManager<ApplicationUser> userManager,
            IActivityLogService activityLogService,
            ISecurityEventService securityEventService)
        {
            _userManager = userManager;
            _activityLogService = activityLogService;
            _securityEventService = securityEventService;
        }

        public async Task<EnableTwoFactorResponse> HandleAsync(EnableTwoFactorCommand command)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(command.UserId);
                if (user == null)
                {
                    return new EnableTwoFactorResponse
                    {
                        Success = false,
                        Message = "User not found",
                        TwoFactorEnabled = false
                    };
                }

                // Check if 2FA is already enabled
                var isTwoFactorEnabled = await _userManager.GetTwoFactorEnabledAsync(user);
                if (isTwoFactorEnabled)
                {
                    return new EnableTwoFactorResponse
                    {
                        Success = true,
                        Message = "Two-factor authentication is already enabled",
                        TwoFactorEnabled = true
                    };
                }

                // Enable 2FA for the user
                var result = await _userManager.SetTwoFactorEnabledAsync(user, true);
                if (result.Succeeded)
                {
                    // Generate recovery codes
                    var recoveryCodes = await _userManager.GenerateNewTwoFactorRecoveryCodesAsync(user, 10);
                    
                    await _activityLogService.LogUserActionAsync(
                        user.Id,
                        "Enable2FA",
                        "Security",
                        user.Id,
                        "Two-factor authentication enabled");

                    await _securityEventService.RecordSuspiciousActivityAsync(
                        user.Id,
                        "TwoFactorEnabled",
                        $"Two-factor authentication enabled for user {user.Email}",
                        "127.0.0.1",
                        "System");

                    return new EnableTwoFactorResponse
                    {
                        Success = true,
                        Message = "Two-factor authentication has been enabled successfully. Please save your recovery codes.",
                        TwoFactorEnabled = true,
                        RecoveryCodes = string.Join("\n", recoveryCodes)
                    };
                }
                else
                {
                    return new EnableTwoFactorResponse
                    {
                        Success = false,
                        Message = $"Failed to enable two-factor authentication: {string.Join(", ", result.Errors.Select(e => e.Description))}",
                        TwoFactorEnabled = false
                    };
                }
            }
            catch (Exception ex)
            {
                return new EnableTwoFactorResponse
                {
                    Success = false,
                    Message = $"An error occurred: {ex.Message}",
                    TwoFactorEnabled = false
                };
            }
        }
    }
}

