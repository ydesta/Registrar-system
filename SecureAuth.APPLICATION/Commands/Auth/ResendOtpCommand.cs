using SecureAuth.APPLICATION.DTOs.Authentication;

namespace SecureAuth.APPLICATION.Commands.Auth
{
    public class ResendOtpCommand : ICommand<ResendOtpResponse>
    {
        public string Email { get; set; } = string.Empty;
        public string Purpose { get; set; } = "Login";
    }
} 