using SecureAuth.APPLICATION.DTOs.Authentication;

namespace SecureAuth.APPLICATION.Commands.Auth
{
    public class VerifyEmailCommand : ICommand<VerifyEmailResponse>
    {
        public string Email { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty;
    }
} 
