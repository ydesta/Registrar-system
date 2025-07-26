using System.Collections.Generic;
using SecureAuth.APPLICATION.DTOs.Admin;

namespace SecureAuth.APPLICATION.Queries.Admin
{
    public class GetRolePermissionsQuery : IQuery<List<PermissionModel>>
    {
        public string RoleId { get; set; } = string.Empty;
    }
} 
