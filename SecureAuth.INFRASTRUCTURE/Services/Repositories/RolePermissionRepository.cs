using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.INFRASTRUCTURE.Data;
using SecureAuth.DOMAIN.Models;
using SecureAuth.DOMAIN.Models.Security;

namespace SecureAuth.INFRASTRUCTURE.Services.Repositories
{
    public class RolePermissionRepository : IRolePermissionRepository
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<ApplicationRole> _roleManager;
        private readonly ApplicationDbContext _context;

        public RolePermissionRepository(
            UserManager<ApplicationUser> userManager,
            RoleManager<ApplicationRole> roleManager,
            ApplicationDbContext context)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _context = context;
        }

        public async Task<bool> HasPermissionAsync(string userId, string permissionName)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    return false;
                }

                var userRoles = await _userManager.GetRolesAsync(user);
                var roleIds = await _roleManager.Roles
                    .Where(r => userRoles.Contains(r.Name))
                    .Select(r => r.Id)
                    .ToListAsync();

                return await _context.RolePermissions
                    .AnyAsync(rp => roleIds.Contains(rp.RoleId) && 
                                  rp.Permission.Name == permissionName);
            }
            catch (Exception)
            {
                return false;
            }
        }

        public async Task<IEnumerable<string>> GetUserPermissionsAsync(string userId)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    return Enumerable.Empty<string>();
                }

                var userRoles = await _userManager.GetRolesAsync(user);
                var roleIds = await _roleManager.Roles
                    .Where(r => userRoles.Contains(r.Name))
                    .Select(r => r.Id)
                    .ToListAsync();

                return await _context.RolePermissions
                    .Where(rp => roleIds.Contains(rp.RoleId))
                    .Select(rp => rp.Permission.Name)
                    .Distinct()
                    .ToListAsync();
            }
            catch (Exception)
            {
                return Enumerable.Empty<string>();
            }
        }

        public async Task<bool> AssignRoleToUserAsync(string userId, string roleName)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    return false;
                }

                var result = await _userManager.AddToRoleAsync(user, roleName);
                return result.Succeeded;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public async Task<bool> RemoveRoleFromUserAsync(string userId, string roleName)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    return false;
                }

                var result = await _userManager.RemoveFromRoleAsync(user, roleName);
                return result.Succeeded;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public async Task<IEnumerable<string>> GetUserRolesAsync(string userId)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    return Enumerable.Empty<string>();
                }

                return await _userManager.GetRolesAsync(user);
            }
            catch (Exception)
            {
                return Enumerable.Empty<string>();
            }
        }

        public async Task<bool> CreateRoleAsync(string roleName, string? description = null)
        {
            try
            {
                var role = new ApplicationRole { Name = roleName, NormalizedName = roleName.ToUpper() };
                var result = await _roleManager.CreateAsync(role);
                return result.Succeeded;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public async Task<bool> DeleteRoleAsync(string roleName)
        {
            try
            {
                var role = await _roleManager.FindByNameAsync(roleName);
                if (role == null)
                {
                    return false;
                }

                var result = await _roleManager.DeleteAsync(role);
                return result.Succeeded;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public async Task<bool> AssignPermissionToRoleAsync(string roleName, string permissionName)
        {
            try
            {
                var role = await _roleManager.FindByNameAsync(roleName);
                if (role == null)
                {
                    return false;
                }

                var permission = await _context.Permissions
                    .FirstOrDefaultAsync(p => p.Name == permissionName);
                if (permission == null)
                {
                    return false;
                }

                var rolePermission = new RolePermission
                {
                    RoleId = role.Id,
                    PermissionId = permission.Id,
                    AssignedAt = DateTime.UtcNow
                };

                _context.RolePermissions.Add(rolePermission);
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public async Task<bool> RemovePermissionFromRoleAsync(string roleName, string permissionName)
        {
            try
            {
                var role = await _roleManager.FindByNameAsync(roleName);
                if (role == null)
                {
                    return false;
                }

                var permission = await _context.Permissions
                    .FirstOrDefaultAsync(p => p.Name == permissionName);
                if (permission == null)
                {
                    return false;
                }

                var rolePermission = await _context.RolePermissions
                    .FirstOrDefaultAsync(rp => rp.RoleId == role.Id && rp.PermissionId == permission.Id);
                if (rolePermission == null)
                {
                    return false;
                }

                _context.RolePermissions.Remove(rolePermission);
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public async Task<IEnumerable<string>> GetRolePermissionsAsync(string roleName)
        {
            try
            {
                var role = await _roleManager.FindByNameAsync(roleName);
                if (role == null)
                {
                    return Enumerable.Empty<string>();
                }

                return await _context.RolePermissions
                    .Where(rp => rp.RoleId == role.Id)
                    .Select(rp => rp.Permission.Name)
                    .ToListAsync();
            }
            catch (Exception)
            {
                return Enumerable.Empty<string>();
            }
        }

        public async Task<Dictionary<string, List<string>>> GetUserRolePermissionsAsync(string userId)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    return new Dictionary<string, List<string>>();
                }

                var userRoles = await _userManager.GetRolesAsync(user);
                var rolePermissions = new Dictionary<string, List<string>>();

                foreach (var roleName in userRoles)
                {
                    var permissions = await GetRolePermissionsAsync(roleName);
                    rolePermissions[roleName] = permissions.ToList();
                }

                return rolePermissions;
            }
            catch (Exception)
            {
                return new Dictionary<string, List<string>>();
            }
        }

        public async Task<bool> IsSuperAdminAsync(string userId)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    return false;
                }

                var roles = await _userManager.GetRolesAsync(user);
                return roles.Contains("Super Admin");
            }
            catch (Exception)
            {
                return false;
            }
        }

        public async Task<bool> HasAdminAccessAsync(string userId)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    return false;
                }

                var roles = await _userManager.GetRolesAsync(user);
                var adminRoles = new[] { "Super Admin", "Admin", "Finance" };
                return roles.Any(r => adminRoles.Contains(r));
            }
            catch (Exception)
            {
                return false;
            }
        }

        public async Task<List<string>> GetAllowedFeaturesAsync(string userId)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    return new List<string>();
                }

                var permissions = await GetUserPermissionsAsync(userId);
                var userRoles = await _userManager.GetRolesAsync(user);
                var features = new List<string>();

                // Map permissions to features
                foreach (var permission in permissions)
                {
                    switch (permission.ToLower())
                    {
                        case "view":
                            features.Add("dashboard");
                            features.Add("profile");
                            features.Add("reports");
                            break;
                        case "request":
                            features.Add("applications");
                            features.Add("requests");
                            break;
                        case "edit":
                            features.Add("content-management");
                            features.Add("user-management");
                            break;
                        case "approve":
                            features.Add("approvals");
                            features.Add("workflow");
                            break;
                        case "pay":
                            features.Add("payments");
                            features.Add("billing");
                            break;
                        case "enroll":
                            features.Add("enrollment");
                            features.Add("courses");
                            break;
                    }
                }

                // Add role-specific features
                foreach (var role in userRoles)
                {
                    switch (role.ToLower())
                    {
                        case "admin":
                            features.AddRange(new[] { "admin-dashboard", "system-settings", "user-management", "role-management", "audit-logs" });
                            break;
                        case "student":
                            features.AddRange(new[] { "student-dashboard", "course-enrollment", "assignments", "grades", "academic-calendar" });
                            break;
                        case "instructor":
                            features.AddRange(new[] { "instructor-dashboard", "course-management", "grade-management", "student-progress", "teaching-materials" });
                            break;
                        case "finance":
                            features.AddRange(new[] { "finance-dashboard", "payment-processing", "billing-management", "financial-reports", "fee-management" });
                            break;
                        case "applicant":
                            features.AddRange(new[] { "application-form", "document-upload", "application-status", "personal-info" });
                            break;
                        case "approvedapplicant":
                            features.AddRange(new[] { "enrollment-process", "course-selection", "payment-setup", "orientation-materials" });
                            break;
                    }
                }

                return features.Distinct().ToList();
            }
            catch (Exception)
            {
                return new List<string>();
            }
        }

        public async Task<bool> AssignPermissionsToRoleAsync(string roleId, List<string> permissionIds)
        {
            try
            {
                var role = await _roleManager.FindByIdAsync(roleId);
                if (role == null)
                {
                    return false;
                }

                var permissions = await _context.Permissions
                    .Where(p => permissionIds.Contains(p.Id))
                    .ToListAsync();

                foreach (var permission in permissions)
                {
                    var existingRolePermission = await _context.RolePermissions
                        .FirstOrDefaultAsync(rp => rp.RoleId == roleId && rp.PermissionId == permission.Id);

                    if (existingRolePermission == null)
                    {
                        var rolePermission = new RolePermission
                        {
                            RoleId = roleId,
                            PermissionId = permission.Id,
                            AssignedAt = DateTime.UtcNow
                        };

                        _context.RolePermissions.Add(rolePermission);
                    }
                }

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public async Task<bool> RemovePermissionsFromRoleAsync(string roleId, List<string> permissionIds)
        {
            try
            {
                var rolePermissions = await _context.RolePermissions
                    .Where(rp => rp.RoleId == roleId && permissionIds.Contains(rp.PermissionId))
                    .ToListAsync();

                _context.RolePermissions.RemoveRange(rolePermissions);
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public async Task<List<string>> GetPermissionsByRoleIdAsync(string roleId)
        {
            try
            {
                return await _context.RolePermissions
                    .Where(rp => rp.RoleId == roleId)
                    .Select(rp => rp.Permission.Name)
                    .ToListAsync();
            }
            catch (Exception)
            {
                return new List<string>();
            }
        }

        public async Task<List<Permission>> GetPermissionObjectsByRoleIdAsync(string roleId)
        {
            try
            {
                return await _context.RolePermissions
                    .Where(rp => rp.RoleId == roleId)
                    .Select(rp => rp.Permission)
                    .ToListAsync();
            }
            catch (Exception)
            {
                return new List<Permission>();
            }
        }
    }
} 