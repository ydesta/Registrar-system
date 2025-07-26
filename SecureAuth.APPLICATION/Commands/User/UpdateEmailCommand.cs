namespace SecureAuth.APPLICATION.Commands.User
{
    public class UpdateEmailCommand : ICommand<UpdateEmailResponse>
    {
        public string UserId { get; set; } = string.Empty;
        public string NewEmail { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class UpdateEmailResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public bool EmailConfirmed { get; set; }
    }
} 