using SecureAuth.APPLICATION.DTOs.Security;

namespace SecureAuth.APPLICATION.Commands.Security
{
    public class BlockUserCommand : ICommand<BlockUserResultModel>
    {
        public string UserId { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
        public DateTime? BlockUntil { get; set; } // null for permanent block
        public bool NotifyUser { get; set; } = true;
    }
} 
