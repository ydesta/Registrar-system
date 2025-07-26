using System.Collections.Generic;
using System.Threading.Tasks;
using SecureAuth.DOMAIN.Models.Security;

namespace SecureAuth.APPLICATION.Interfaces
{
    public interface IRolePermissionRepository
    {
        Task<bool> HasPermissionAsync(string userId, string permissionName);
        Task<IEnumerable<string>> GetUserPermissionsAsync(string userId);
        Task<bool> AssignRoleToUserAsync(string userId, string roleName);
        Task<bool> RemoveRoleFromUserAsync(string userId, string roleName);
        Task<IEnumerable<string>> GetUserRolesAsync(string userId);
        Task<bool> CreateRoleAsync(string roleName, string? description = null);
        Task<bool> DeleteRoleAsync(string roleName);
        Task<bool> AssignPermissionToRoleAsync(string roleName, string permissionName);
        Task<bool> RemovePermissionFromRoleAsync(string roleName, string permissionName);
        Task<IEnumerable<string>> GetRolePermissionsAsync(string roleName);
        Task<Dictionary<string, List<string>>> GetUserRolePermissionsAsync(string userId);
        Task<bool> IsSuperAdminAsync(string userId);
        Task<bool> HasAdminAccessAsync(string userId);
        Task<List<string>> GetAllowedFeaturesAsync(string userId);
        Task<bool> AssignPermissionsToRoleAsync(string roleId, List<string> permissionIds);
        Task<bool> RemovePermissionsFromRoleAsync(string roleId, List<string> permissionIds);
        Task<List<string>> GetPermissionsByRoleIdAsync(string roleId);
        Task<List<Permission>> GetPermissionObjectsByRoleIdAsync(string roleId);
    }
} 
