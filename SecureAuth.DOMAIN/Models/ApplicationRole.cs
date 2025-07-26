using Microsoft.AspNetCore.Identity;
using SecureAuth.DOMAIN.Models.Security;
using System.Collections.Generic;

namespace SecureAuth.DOMAIN.Models
{
    public class ApplicationRole : IdentityRole
    {
        public string? Description { get; set; }
        public bool IsActive { get; set; } = true;
        public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
    }
} 