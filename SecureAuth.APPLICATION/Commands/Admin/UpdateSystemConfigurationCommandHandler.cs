using SecureAuth.APPLICATION.Commands.Admin;
using SecureAuth.APPLICATION.DTOs.Admin;
using SecureAuth.APPLICATION.Interfaces;

namespace SecureAuth.APPLICATION.Commands.Admin
{
    public class UpdateSystemConfigurationCommandHandler : ICommandHandler<UpdateSystemConfigurationCommand, bool>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IActivityLogService _activityLogService;

        public UpdateSystemConfigurationCommandHandler(
            IUnitOfWork unitOfWork,
            IActivityLogService activityLogService)
        {
            _unitOfWork = unitOfWork;
            _activityLogService = activityLogService;
        }

        public async Task<bool> HandleAsync(UpdateSystemConfigurationCommand command)
        {
            try
            {
                // Validate configuration
                if (command.Configuration == null)
                {
                    return false;
                }

                // Validate security settings
                if (command.Configuration.SecuritySettings != null)
                {
                    if (command.Configuration.SecuritySettings.PasswordMinLength < 8)
                    {
                        return false; // Minimum password length validation
                    }

                    if (command.Configuration.SecuritySettings.SessionTimeoutMinutes < 15)
                    {
                        return false; // Minimum session timeout validation
                    }
                }

                // Update configuration in database or configuration store
                var success = await _unitOfWork.SystemConfiguration.UpdateConfigurationAsync(command.Configuration);
                if (!success)
                {
                    return false;
                }

                // Log the configuration change
                await _activityLogService.LogUserActionAsync(
                    "System",
                    "UpdateSystemConfiguration",
                    "SystemConfiguration",
                    "System",
                    $"System configuration updated: {command.Configuration.ConfigurationSection}");

                await _unitOfWork.SaveChangesAsync();
                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }
    }
} 
