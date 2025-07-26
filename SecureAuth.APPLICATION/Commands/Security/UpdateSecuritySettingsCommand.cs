using SecureAuth.APPLICATION.DTOs.Security;

namespace SecureAuth.APPLICATION.Commands.Security
{
    public class UpdateSecuritySettingsCommand : ICommand<bool>
    {
        public SecuritySettingsModel SecuritySettings { get; set; } = new();
    }
} 
