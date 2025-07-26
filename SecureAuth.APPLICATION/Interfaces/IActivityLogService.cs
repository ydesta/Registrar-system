using System.Threading.Tasks;

namespace SecureAuth.APPLICATION.Interfaces
{
    public interface IActivityLogService
    {
        Task LogActionAsync(string userId, string action, string details = null);
        Task LogUserActionAsync(string userId, string action, string entityType, string entityId, string details = null);
        Task LogRoleCreatedAsync(string userId, string roleId, string roleName);
        Task LogPermissionCreatedAsync(string userId, string permissionId, string permissionName);
    }
} 
