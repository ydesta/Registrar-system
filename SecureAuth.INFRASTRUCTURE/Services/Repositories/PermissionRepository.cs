using Microsoft.EntityFrameworkCore;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.INFRASTRUCTURE.Data;
using SecureAuth.DOMAIN.Models.Security;

namespace SecureAuth.INFRASTRUCTURE.Services.Repositories
{
    public class PermissionRepository : Repository<Permission>, IPermissionRepository
    {
        public PermissionRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<Permission> GetByNameAsync(string name)
        {
            return await _dbSet.FirstOrDefaultAsync(p => p.Name == name);
        }

        public async Task<IEnumerable<Permission>> GetByRoleAsync(string roleId)
        {
            return await _context.RolePermissions
                .Where(rp => rp.RoleId == roleId)
                .Select(rp => rp.Permission)
                .ToListAsync();
        }

        public async Task<IEnumerable<Permission>> GetByUserAsync(string userId)
        {
            var userRoles = await _context.UserRoles
                .Where(ur => ur.UserId == userId)
                .Select(ur => ur.RoleId)
                .ToListAsync();

            return await _context.RolePermissions
                .Where(rp => userRoles.Contains(rp.RoleId))
                .Select(rp => rp.Permission)
                .Distinct()
                .ToListAsync();
        }

        public async Task<bool> ExistsByNameAsync(string name)
        {
            return await _dbSet.AnyAsync(p => p.Name == name);
        }

        public async Task<IEnumerable<Permission>> GetSystemPermissionsAsync()
        {
            var systemPermissionNames = new[] 
            { 
                "View", "Create", "Edit", "Delete", "Approve", "Reject", 
                "ManageUsers", "ManageRoles", "ManagePermissions", "ViewAuditLogs" 
            };
            
            return await _dbSet.Where(p => systemPermissionNames.Contains(p.Name)).ToListAsync();
        }

        public async Task<IEnumerable<Permission>> GetCustomPermissionsAsync()
        {
            var systemPermissionNames = new[] 
            { 
                "View", "Create", "Edit", "Delete", "Approve", "Reject", 
                "ManageUsers", "ManageRoles", "ManagePermissions", "ViewAuditLogs" 
            };
            
            return await _dbSet.Where(p => !systemPermissionNames.Contains(p.Name)).ToListAsync();
        }

        public async Task<List<Permission>> GetByIdsAsync(List<string> permissionIds)
        {
            return await _dbSet.Where(p => permissionIds.Contains(p.Id)).ToListAsync();
        }
    }
} 