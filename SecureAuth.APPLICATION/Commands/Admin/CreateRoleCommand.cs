namespace SecureAuth.APPLICATION.Commands.Admin
{
    public class CreateRoleCommand : ICommand<string>
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; }
        public bool IsActive { get; set; } = true;
        public string? CurrentUserId { get; set; }
    }
} 
