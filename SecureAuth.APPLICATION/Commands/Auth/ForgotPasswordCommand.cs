using SecureAuth.APPLICATION.DTOs.Authentication;

namespace SecureAuth.APPLICATION.Commands.Auth
{
    public class ForgotPasswordCommand : ICommand<ForgotPasswordResponse>
    {
        public string Email { get; set; } = string.Empty;
    }
} 
