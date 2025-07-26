namespace SecureAuth.APPLICATION.Commands.User
{
    public class AdminUpdateEmailCommand : ICommand<UpdateEmailResponse>
    {
        public string UserId { get; set; } = string.Empty;
        public string NewEmail { get; set; } = string.Empty;
    }
} 