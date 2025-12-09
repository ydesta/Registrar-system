using SecureAuth.APPLICATION.Commands;

namespace SecureAuth.APPLICATION.Commands.Auth
{
    public class DisableTwoFactorCommand : ICommand<DisableTwoFactorResponse>
    {
        public string UserId { get; set; } = string.Empty;
        public string? Code { get; set; }
        public string? Password { get; set; }
    }

    public class DisableTwoFactorResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public bool TwoFactorEnabled { get; set; }
    }
}

