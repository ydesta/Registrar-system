using SecureAuth.APPLICATION.DTOs.Authentication;

namespace SecureAuth.APPLICATION.Commands.Auth
{
    public class ResetPasswordCommand : ICommand<ResetPasswordResponse>
    {
        public string Email { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
        public string ConfirmPassword { get; set; } = string.Empty;
    }
} 
