using SecureAuth.APPLICATION.DTOs.Authentication;

namespace SecureAuth.APPLICATION.Commands.Auth
{
    public class ResendVerificationCommand : ICommand<ResendVerificationResponse>
    {
        public string Email { get; set; } = string.Empty;
    }
} 