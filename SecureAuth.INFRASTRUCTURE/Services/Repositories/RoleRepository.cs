using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.INFRASTRUCTURE.Data;
using SecureAuth.DOMAIN.Models;

namespace SecureAuth.INFRASTRUCTURE.Services.Repositories
{
    public class RoleRepository : Repository<ApplicationRole>, IRoleRepository
    {
        private readonly RoleManager<ApplicationRole> _roleManager;
        private readonly UserManager<ApplicationUser> _userManager;

        public RoleRepository(
            ApplicationDbContext context, 
            RoleManager<ApplicationRole> roleManager,
            UserManager<ApplicationUser> userManager) : base(context)
        {
            _roleManager = roleManager;
            _userManager = userManager;
        }

        public async Task<ApplicationRole> GetByNameAsync(string name)
        {
            return await _roleManager.FindByNameAsync(name);
        }

        public async Task<IEnumerable<ApplicationRole>> GetByUserAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return Enumerable.Empty<ApplicationRole>();

            var roleNames = await _userManager.GetRolesAsync(user);
            var roles = new List<ApplicationRole>();

            foreach (var roleName in roleNames)
            {
                var role = await _roleManager.FindByNameAsync(roleName);
                if (role != null)
                    roles.Add(role);
            }

            return roles;
        }

        public async Task<bool> ExistsByNameAsync(string name)
        {
            return await _roleManager.RoleExistsAsync(name);
        }

        public async Task<IEnumerable<ApplicationRole>> GetSystemRolesAsync()
        {
            var systemRoleNames = new[] { "Super Admin", "Admin", "User", "Guest" };
            return await _dbSet.Where(r => systemRoleNames.Contains(r.Name)).ToListAsync();
        }

        public async Task<IEnumerable<ApplicationRole>> GetCustomRolesAsync()
        {
            var systemRoleNames = new[] { "Super Admin", "Admin", "User", "Guest" };
            return await _dbSet.Where(r => !systemRoleNames.Contains(r.Name)).ToListAsync();
        }

        public async Task<int> GetUserCountAsync(string roleName)
        {
            var users = await _userManager.GetUsersInRoleAsync(roleName);
            return users.Count;
        }

        public async Task<int> GetUserCountByIdAsync(string roleId)
        {
            // First get the role by ID to get its name
            var role = await _roleManager.FindByIdAsync(roleId);
            if (role == null)
            {
                return 0;
            }

            // Then get user count by role name
            var users = await _userManager.GetUsersInRoleAsync(role.Name);
            return users.Count;
        }

        public async Task<IEnumerable<string>> GetRoleNamesAsync()
        {
            return await _dbSet.Select(r => r.Name).ToListAsync();
        }
    }
} 