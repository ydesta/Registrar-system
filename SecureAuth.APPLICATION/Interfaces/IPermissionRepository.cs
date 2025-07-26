using SecureAuth.DOMAIN.Models.Security;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SecureAuth.APPLICATION.Interfaces
{
    public interface IPermissionRepository : IRepository<Permission>
    {
        // Domain-specific permission operations
        Task<Permission> GetByNameAsync(string name);
        Task<IEnumerable<Permission>> GetByRoleAsync(string roleId);
        Task<IEnumerable<Permission>> GetByUserAsync(string userId);
        Task<bool> ExistsByNameAsync(string name);
        Task<IEnumerable<Permission>> GetSystemPermissionsAsync();
        Task<IEnumerable<Permission>> GetCustomPermissionsAsync();
        // CQRS addition
        Task<List<Permission>> GetByIdsAsync(List<string> permissionIds);
    }
} 
