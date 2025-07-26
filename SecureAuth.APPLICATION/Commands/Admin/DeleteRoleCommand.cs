namespace SecureAuth.APPLICATION.Commands.Admin
{
    public class DeleteRoleCommand : ICommand<bool>
    {
        public string Id { get; set; } = string.Empty;
        public string? CurrentUserId { get; set; }
    }
} 
