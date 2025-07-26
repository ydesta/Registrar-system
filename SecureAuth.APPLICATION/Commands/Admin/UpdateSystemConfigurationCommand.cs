using SecureAuth.APPLICATION.DTOs.Admin;

namespace SecureAuth.APPLICATION.Commands.Admin
{
    public class UpdateSystemConfigurationCommand : ICommand<bool>
    {
        public SystemConfigurationModel Configuration { get; set; } = new();
    }
} 
