using System.Collections.Generic;

namespace SecureAuth.APPLICATION.Commands.Admin
{
    public class RemovePermissionsFromRoleCommand : ICommand<bool>
    {
        public string RoleId { get; set; } = string.Empty;
        public List<string> PermissionIds { get; set; } = new List<string>();
    }
} 
