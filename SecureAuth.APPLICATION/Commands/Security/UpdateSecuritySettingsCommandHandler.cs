using SecureAuth.APPLICATION.Commands.Security;
using SecureAuth.APPLICATION.DTOs.Security;
using SecureAuth.APPLICATION.Interfaces;

namespace SecureAuth.APPLICATION.Commands.Security
{
    public class UpdateSecuritySettingsCommandHandler : ICommandHandler<UpdateSecuritySettingsCommand, bool>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IActivityLogService _activityLogService;

        public UpdateSecuritySettingsCommandHandler(
            IUnitOfWork unitOfWork,
            IActivityLogService activityLogService)
        {
            _unitOfWork = unitOfWork;
            _activityLogService = activityLogService;
        }

        public async Task<bool> HandleAsync(UpdateSecuritySettingsCommand command)
        {
            try
            {
                var settings = command.SecuritySettings;
                
                // Validate security settings
                if (!ValidateSecuritySettings(settings))
                {
                    return false;
                }

                // Update security settings
                var success = await _unitOfWork.SecuritySettings.UpdateSettingsAsync(settings);
                if (!success)
                {
                    return false;
                }

                // Log the settings change
                await _activityLogService.LogUserActionAsync(
                    "System",
                    "UpdateSecuritySettings",
                    "SecuritySettings",
                    "System",
                    $"Security settings updated: SessionTimeout={settings.SessionTimeoutMinutes}min, " +
                    $"MaxLoginAttempts={settings.MaxLoginAttempts}, " +
                    $"TwoFactorRequired={settings.TwoFactorRequired}, " +
                    $"IpWhitelistEnabled={settings.IpWhitelistEnabled}");

                await _unitOfWork.SaveChangesAsync();
                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

        private bool ValidateSecuritySettings(SecuritySettingsModel settings)
        {
            // Session timeout validation
            if (settings.SessionTimeoutMinutes < 5)
            {
                return false; // Minimum 5 minutes
            }

            if (settings.SessionTimeoutMinutes > 1440)
            {
                return false; // Maximum 24 hours
            }

            // Login attempts validation
            if (settings.MaxLoginAttempts < 1 || settings.MaxLoginAttempts > 10)
            {
                return false; // 1-10 attempts
            }

            // Lockout duration validation
            if (settings.LockoutDurationMinutes < 1 || settings.LockoutDurationMinutes > 1440)
            {
                return false; // 1 minute to 24 hours
            }

            // Password change interval validation
            if (settings.PasswordChangeIntervalDays < 0 || settings.PasswordChangeIntervalDays > 365)
            {
                return false; // 0-365 days
            }

            // IP whitelist validation
            if (settings.IpWhitelistEnabled && (settings.IpWhitelist == null || !settings.IpWhitelist.Any()))
            {
                return false; // IP whitelist enabled but no IPs provided
            }

            return true;
        }
    }
} 
