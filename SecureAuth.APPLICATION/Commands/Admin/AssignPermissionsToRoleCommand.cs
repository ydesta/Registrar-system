namespace SecureAuth.APPLICATION.Commands.Admin
{
    public class AssignPermissionsToRoleCommand : ICommand<bool>
    {
        public string RoleId { get; set; } = string.Empty;
        public List<string> PermissionIds { get; set; } = new List<string>();
        public string CurrentUserId { get; set; } = string.Empty;
    }
} 
