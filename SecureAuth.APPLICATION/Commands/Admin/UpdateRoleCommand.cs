namespace SecureAuth.APPLICATION.Commands.Admin
{
    public class UpdateRoleCommand : ICommand<bool>
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsActive { get; set; } = true;
        public string? CurrentUserId { get; set; }
    }
} 
