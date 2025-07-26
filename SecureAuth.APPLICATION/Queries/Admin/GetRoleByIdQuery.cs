using SecureAuth.APPLICATION.DTOs.Admin;

namespace SecureAuth.APPLICATION.Queries.Admin
{
    public class GetRoleByIdQuery : IQuery<RoleModel>
    {
        public string RoleId { get; set; } = string.Empty;
    }
} 
