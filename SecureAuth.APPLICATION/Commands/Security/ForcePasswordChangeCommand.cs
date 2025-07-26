using SecureAuth.APPLICATION.DTOs.Security;

namespace SecureAuth.APPLICATION.Commands.Security
{
    public class ForcePasswordChangeCommand : ICommand<ForcePasswordChangeResultModel>
    {
        public string UserId { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
        public bool NotifyUser { get; set; } = true;
        public bool RequireImmediateChange { get; set; } = true;
    }
} 
