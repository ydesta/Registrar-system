using System.ComponentModel.DataAnnotations;
using SecureAuth.APPLICATION.DTOs.Authentication;

namespace SecureAuth.APPLICATION.Commands.User
{
    public class AdminResendEmailVerificationCommand : ICommand<ResendVerificationResponse>
    {
        [Required]
        public string UserId { get; set; } = string.Empty;
    }
}
