using System.Threading.Tasks;

namespace SecureAuth.DOMAIN.Interfaces
{
    public interface IActivityLogService
    {
        // Core activity logging methods
        Task LogActionAsync(string userId, string action, string details);
        Task LogRoleCreatedAsync(string userId, string roleId, string roleName);
        Task LogPermissionCreatedAsync(string userId, string permissionId, string permissionName);
        Task LogUserActionAsync(string userId, string action, string entityType, string entityId, string details = null);
        // Audit logging methods (for backward compatibility)
        Task<bool> LogActivityAsync(string userId, string action, string entityType, string entityId, string? details = null, bool status = true, string? errorMessage = null);
        Task<bool> DeleteAuditLogAsync(string id);
    }
} 