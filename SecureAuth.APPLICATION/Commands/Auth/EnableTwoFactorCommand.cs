using SecureAuth.APPLICATION.Commands;

namespace SecureAuth.APPLICATION.Commands.Auth
{
    public class EnableTwoFactorCommand : ICommand<EnableTwoFactorResponse>
    {
        public string UserId { get; set; } = string.Empty;
        public string? Password { get; set; }
    }

    public class EnableTwoFactorResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public bool TwoFactorEnabled { get; set; }
        public string? RecoveryCodes { get; set; }
    }
}

