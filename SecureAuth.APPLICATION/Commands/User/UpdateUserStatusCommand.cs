using System.ComponentModel.DataAnnotations;

namespace SecureAuth.APPLICATION.Commands.User
{
    public class UpdateUserStatusCommand : ICommand<bool>
    {
        [Required]
        public string UserId { get; set; } = string.Empty;
        
        [Required]
        public bool IsActive { get; set; }
        
        public string? Reason { get; set; }
    }
} 