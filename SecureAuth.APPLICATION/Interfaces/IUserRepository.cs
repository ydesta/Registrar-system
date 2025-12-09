using SecureAuth.DOMAIN.Models;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;

namespace SecureAuth.APPLICATION.Interfaces
{
    public interface IUserRepository : IRepository<ApplicationUser>
    {
        // Domain-specific user operations
        Task<ApplicationUser> GetByEmailAsync(string email);
        Task<ApplicationUser> GetByUsernameAsync(string username);
        Task<IEnumerable<ApplicationUser>> GetByRoleAsync(string roleName);
        Task<IEnumerable<ApplicationUser>> GetByRoleIdAsync(string roleId);
        Task<IEnumerable<ApplicationUser>> GetActiveUsersAsync();
        Task<IEnumerable<ApplicationUser>> GetUsersByStatusAsync(bool isActive);
        Task<bool> IsEmailUniqueAsync(string email);
        Task<bool> IsUsernameUniqueAsync(string username);
        Task UpdateLastLoginAsync(string userId, DateTime loginTime);
        Task IncrementFailedLoginAttemptsAsync(string userId);
        Task ResetFailedLoginAttemptsAsync(string userId);
        Task LockUserAsync(string userId, DateTimeOffset lockoutEnd);
        Task UnlockUserAsync(string userId);
        // CQRS addition
        Task<List<ApplicationUser>> GetUsersInRoleAsync(string roleName);
        Task<List<ApplicationUser>> GetUsersInRoleByIdAsync(string roleId);
        Task<bool> UpdateUserStatusAsync(string userId, bool isActive);
        IQueryable<ApplicationUser> Query();
    }
} 
