using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.INFRASTRUCTURE.Data;
using SecureAuth.DOMAIN.Models;

namespace SecureAuth.INFRASTRUCTURE.Services.Repositories
{
    public class UserRepository : Repository<ApplicationUser>, IUserRepository
    {
        private readonly UserManager<ApplicationUser> _userManager;

        public UserRepository(ApplicationDbContext context, UserManager<ApplicationUser> userManager) : base(context)
        {
            _userManager = userManager;
        }

        public async Task<ApplicationUser> GetByEmailAsync(string email)
        {
            return await _userManager.FindByEmailAsync(email);
        }

        public async Task<ApplicationUser> GetByUsernameAsync(string username)
        {
            return await _userManager.FindByNameAsync(username);
        }

        public async Task<IEnumerable<ApplicationUser>> GetByRoleAsync(string roleName)
        {
            return await _userManager.GetUsersInRoleAsync(roleName);
        }

        public async Task<IEnumerable<ApplicationUser>> GetByRoleIdAsync(string roleId)
        {
            // First get the role by ID to get its name
            var role = await _context.Roles.FindAsync(roleId);
            if (role == null)
            {
                return Enumerable.Empty<ApplicationUser>();
            }

            // Then get users in that role by name
            return await _userManager.GetUsersInRoleAsync(role.Name);
        }

        public async Task<IEnumerable<ApplicationUser>> GetActiveUsersAsync()
        {
            return await _dbSet.Where(u => u.IsActive).ToListAsync();
        }

        public async Task<IEnumerable<ApplicationUser>> GetUsersByStatusAsync(bool isActive)
        {
            return await _dbSet.Where(u => u.IsActive == isActive).ToListAsync();
        }

        public async Task<bool> IsEmailUniqueAsync(string email)
        {
            return !await _dbSet.AnyAsync(u => u.Email == email);
        }

        public async Task<bool> IsUsernameUniqueAsync(string username)
        {
            return !await _dbSet.AnyAsync(u => u.UserName == username);
        }

        public async Task UpdateLastLoginAsync(string userId, DateTime loginTime)
        {
            var user = await GetByIdAsync(userId);
            if (user != null)
            {
                user.LastLoginAt = loginTime;
                await UpdateAsync(user);
            }
        }

        public async Task IncrementFailedLoginAttemptsAsync(string userId)
        {
            var user = await GetByIdAsync(userId);
            if (user != null)
            {
                user.FailedLoginAttempts++;
                await UpdateAsync(user);
            }
        }

        public async Task ResetFailedLoginAttemptsAsync(string userId)
        {
            var user = await GetByIdAsync(userId);
            if (user != null)
            {
                user.FailedLoginAttempts = 0;
                await UpdateAsync(user);
            }
        }

        public async Task LockUserAsync(string userId, DateTimeOffset lockoutEnd)
        {
            var user = await GetByIdAsync(userId);
            if (user != null)
            {
                Console.WriteLine($"=== LOCKING USER ===");
                Console.WriteLine($"User: {user.Email}");
                Console.WriteLine($"Setting LockoutEnd to: {lockoutEnd} (UTC)");
                Console.WriteLine($"LockoutEnd is: {lockoutEnd.DateTime} (local)");
                
                user.LockoutEnd = lockoutEnd;
                _dbSet.Update(user);
                await _context.SaveChangesAsync();
                
                Console.WriteLine($"User locked successfully. LockoutEnd saved as: {user.LockoutEnd}");
                Console.WriteLine($"====================");
            }
        }

        public async Task UnlockUserAsync(string userId)
        {
            var user = await GetByIdAsync(userId);
            if (user != null)
            {
                user.LockoutEnd = null;
                user.FailedLoginAttempts = 0;
                await UpdateAsync(user);
            }
        }

        public async Task<List<ApplicationUser>> GetUsersInRoleAsync(string roleName)
        {
            var users = await _userManager.GetUsersInRoleAsync(roleName);
            return users.ToList();
        }

        public async Task<List<ApplicationUser>> GetUsersInRoleByIdAsync(string roleId)
        {
            // First get the role by ID to get its name
            var role = await _context.Roles.FindAsync(roleId);
            if (role == null)
            {
                return new List<ApplicationUser>();
            }

            // Then get users in that role by name
            var users = await _userManager.GetUsersInRoleAsync(role.Name);
            return users.ToList();
        }

        public async Task<bool> UpdateUserStatusAsync(string userId, bool isActive)
        {
            try
            {
                var user = await GetByIdAsync(userId);
                if (user == null)
                {
                    return false;
                }

                user.IsActive = isActive;
                _dbSet.Update(user);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public IQueryable<ApplicationUser> Query()
        {
            return _dbSet.AsQueryable();
        }
    }
} 