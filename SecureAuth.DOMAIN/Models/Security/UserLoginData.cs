using System.Collections.Generic;

namespace SecureAuth.DOMAIN.Models.Security
{
    public class UserLoginData
    {
        public List<string> UserRoles { get; set; } = new List<string>();
        public List<string> UserPermissions { get; set; } = new List<string>();
        public Dictionary<string, List<string>> RolePermissions { get; set; } = new Dictionary<string, List<string>>();
        public bool IsSuperAdmin { get; set; }
        public bool HasAdminAccess { get; set; }
    }
} 