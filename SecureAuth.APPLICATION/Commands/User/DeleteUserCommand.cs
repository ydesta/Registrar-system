namespace SecureAuth.APPLICATION.Commands.User
{
    public class DeleteUserCommand : ICommand<bool>
    {
        public string UserId { get; set; } = string.Empty;
        public bool PermanentDelete { get; set; } = false;
    }
} 
