using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SecureAuth.DOMAIN.Models;
using SecureAuth.INFRASTRUCTURE.Data;

namespace SecureAuth.INFRASTRUCTURE.Helpers
{
    public static class PermissionHelper
    {
        public static async Task<bool> HasPermissionAsync(UserManager<ApplicationUser> userManager, ApplicationUser user, string permissionName, DbContextOptions<ApplicationDbContext> options)
        {
            var roles = await userManager.GetRolesAsync(user);
            var roleIds = roles.Select(r => r).ToList();

            using (var context = new ApplicationDbContext(options))
            {
                return context.RolePermissions
                    .Include(rp => rp.Permission)
                    .Any(rp => roleIds.Contains(rp.RoleId) && rp.Permission != null && rp.Permission.Name == permissionName);
            }
        }
    }
} 
