using Microsoft.AspNetCore.Identity;
using SecureAuth.DOMAIN.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SecureAuth.APPLICATION.Interfaces
{
    public interface IRoleRepository : IRepository<ApplicationRole>
    {
        // Domain-specific role operations
        Task<ApplicationRole> GetByNameAsync(string name);
        Task<IEnumerable<ApplicationRole>> GetByUserAsync(string userId);
        Task<bool> ExistsByNameAsync(string name);
        Task<IEnumerable<ApplicationRole>> GetSystemRolesAsync();
        Task<IEnumerable<ApplicationRole>> GetCustomRolesAsync();
        Task<int> GetUserCountAsync(string roleName);
        Task<int> GetUserCountByIdAsync(string roleId);
        Task<IEnumerable<string>> GetRoleNamesAsync();
    }
} 
