using SecureAuth.APPLICATION.DTOs.Authentication;

namespace SecureAuth.APPLICATION.Commands.Auth
{
    public class LoginCommand : ICommand<LoginResponse>
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public bool RememberMe { get; set; } = false;
        public string? TwoFactorCode { get; set; }
    }
} 
