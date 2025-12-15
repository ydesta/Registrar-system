using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using SecureAuth.APPLICATION.Mediator;
using SecureAuth.APPLICATION.Commands.Admin;
using SecureAuth.APPLICATION.Queries.Admin;
using SecureAuth.APPLICATION.DTOs.Admin;
using SecureAuth.DOMAIN.Models;
using Microsoft.AspNetCore.Identity;
using SecureAuth.INFRASTRUCTURE.Data;
using SecureAuth.INFRASTRUCTURE.SeedData;
using SecureAuth.DOMAIN.Models.Security;
using SecureAuth.INFRASTRUCTURE.Services;
using SecureAuth.API.Configuration;
using Microsoft.EntityFrameworkCore;

namespace SecureAuth.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Super Admin")]
    public class AdminController : ControllerBase
    {
        private readonly IMediator _mediator;

        public AdminController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet("dashboard")]
        public async Task<ActionResult<AdminDashboardResponseModel>> GetDashboard()
        {
            try
            {
                var query = new GetSystemStatisticsQuery();
                var result = await _mediator.QueryAsync<GetSystemStatisticsQuery, SystemStatisticsModel>(query);
                
                if (result != null)
                {
                    return Ok(new AdminDashboardResponseModel
                    {
                        TotalUsers = result.UserStatistics?.TotalUsers ?? 0,
                        ActiveUsers = result.UserStatistics?.ActiveUsers ?? 0,
                        TotalRoles = 0, // TODO: Get from role statistics
                        TotalPermissions = 0, // TODO: Get from permission statistics
                        SystemUptime = TimeSpan.Zero, // TODO: Calculate from system start time
                        LastBackup = DateTime.UtcNow, // TODO: Get from backup service
                        DatabaseSize = "0 MB", // TODO: Get from database service
                        RecentActivity = new List<ActivityLogResponseModel>() // TODO: Get recent activity
                    });
                }
                
                return NotFound(new AdminDashboardResponseModel());
            }
            catch (Exception ex)
            {
                return StatusCode(500, new AdminDashboardResponseModel());
            }
        }

        [HttpPost("clear-audit-logs")]
        public async Task<ActionResult<AuditLogCleanupResultModel>> ClearAuditLogs([FromBody] ClearAuditLogsRequest request)
        {
            try
            {
                var command = new ClearAuditLogsCommand();
                var result = await _mediator.SendAsync<ClearAuditLogsCommand, AuditLogCleanupResultModel>(command);
                
                if (result.Success)
                {
                    return Ok(result);
                }
                
                return BadRequest(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new AuditLogCleanupResultModel
                {
                    Success = false,
                    Message = "An error occurred while clearing audit logs"
                });
            }
        }

        [HttpDelete("roles/{id}")]
        public async Task<ActionResult<RoleResponseModel>> DeleteRole(string id)
        {
            try
            {
                var command = new DeleteRoleCommand { Id = id };
                var result = await _mediator.SendAsync<DeleteRoleCommand, bool>(command);
                
                if (result)
                {
                    return Ok(new RoleResponseModel
                    {
                        Id = id,
                        Name = "Deleted Role",
                        Description = "Role has been deleted",
                        UserCount = 0,
                        PermissionCount = 0,
                        CreatedAt = DateTime.UtcNow
                    });
                }
                
                return BadRequest(new RoleResponseModel());
            }
            catch (Exception ex)
            {
                return StatusCode(500, new RoleResponseModel());
            }
        }

        [HttpPut("roles/{id}")]
        public async Task<ActionResult<RoleResponseModel>> UpdateRole(string id, [FromBody] UpdateRoleModel model)
        {
            try
            {
                var command = new UpdateRoleCommand
                {
                    Id = id,
                    Name = model.Name,
                    Description = model.Description
                };

                var result = await _mediator.SendAsync<UpdateRoleCommand, bool>(command);
                
                if (result)
                {
                    return Ok(new RoleResponseModel
                    {
                        Id = id,
                        Name = model.Name,
                        Description = model.Description,
                        UserCount = 0,
                        PermissionCount = 0,
                        CreatedAt = DateTime.UtcNow
                    });
                }
                
                return BadRequest(new RoleResponseModel());
            }
            catch (Exception ex)
            {
                return StatusCode(500, new RoleResponseModel());
            }
        }

        [HttpPost("assign-super-admin")]
        [AllowAnonymous]
        public async Task<IActionResult> AssignSuperAdminRole()
        {
            try
            {
                var userManager = HttpContext.RequestServices.GetRequiredService<UserManager<ApplicationUser>>();
                var roleManager = HttpContext.RequestServices.GetRequiredService<RoleManager<ApplicationRole>>();

                // Ensure Super Admin role exists
                if (!await roleManager.RoleExistsAsync("Super Admin"))
                {
                    var superAdminRole = new ApplicationRole { Name = "Super Admin", NormalizedName = "SUPER ADMIN" };
                    await roleManager.CreateAsync(superAdminRole);
                }

                // Find the user
                var user = await userManager.FindByEmailAsync("ydesta3614@gmail.com");
                if (user == null)
                {
                    return NotFound("User not found");
                }

                // Check if user already has the role
                var userRoles = await userManager.GetRolesAsync(user);
                if (userRoles.Contains("Super Admin"))
                {
                    return Ok(new { message = "User already has Super Admin role", roles = userRoles });
                }

                // Assign the role
                var result = await userManager.AddToRoleAsync(user, "Super Admin");
                if (result.Succeeded)
                {
                    var updatedRoles = await userManager.GetRolesAsync(user);
                    return Ok(new { message = "Super Admin role assigned successfully", roles = updatedRoles });
                }
                else
                {
                    return BadRequest(new { message = "Failed to assign role", errors = result.Errors });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred", error = ex.Message });
            }
        }

        [HttpPost("assign-super-admin-to-current-user")]
        [AllowAnonymous]
        public async Task<IActionResult> AssignSuperAdminRoleToCurrentUser()
        {
            try
            {
                var userManager = HttpContext.RequestServices.GetRequiredService<UserManager<ApplicationUser>>();
                var roleManager = HttpContext.RequestServices.GetRequiredService<RoleManager<ApplicationRole>>();

                // Get current user from JWT claims
                var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(currentUserId))
                {
                    return Unauthorized("User not authenticated");
                }

                // Ensure Super Admin role exists
                if (!await roleManager.RoleExistsAsync("Super Admin"))
                {
                    var superAdminRole = new ApplicationRole { Name = "Super Admin", NormalizedName = "SUPER ADMIN" };
                    await roleManager.CreateAsync(superAdminRole);
                }

                // Find the current user
                var user = await userManager.FindByIdAsync(currentUserId);
                if (user == null)
                {
                    return NotFound("Current user not found");
                }

                // Check if user already has the role
                var userRoles = await userManager.GetRolesAsync(user);
                if (userRoles.Contains("Super Admin"))
                {
                    return Ok(new { message = "User already has Super Admin role", roles = userRoles });
                }

                // Assign the role
                var result = await userManager.AddToRoleAsync(user, "Super Admin");
                if (result.Succeeded)
                {
                    var updatedRoles = await userManager.GetRolesAsync(user);
                    return Ok(new { message = "Super Admin role assigned successfully to current user", roles = updatedRoles });
                }
                else
                {
                    return BadRequest(new { message = "Failed to assign role", errors = result.Errors });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred", error = ex.Message });
            }
        }

        [HttpPost("seed-permissions")]
        [AllowAnonymous]
        public async Task<IActionResult> SeedPermissions()
        {
            try
            {
                var context = HttpContext.RequestServices.GetRequiredService<ApplicationDbContext>();
                var roleManager = HttpContext.RequestServices.GetRequiredService<RoleManager<ApplicationRole>>();

                // Seed permissions
                var permissions = PermissionSeedData.GetPermissions();
                foreach (var permission in permissions)
                {
                    var existingPermission = await context.Permissions.FindAsync(permission.Id);
                    if (existingPermission == null)
                    {
                        await context.Permissions.AddAsync(permission);
                    }
                }

                // Ensure Super Admin role exists
                var superAdminRole = await roleManager.FindByNameAsync("Super Admin");
                if (superAdminRole == null)
                {
                    superAdminRole = new ApplicationRole { Name = "Super Admin", NormalizedName = "SUPER ADMIN" };
                    await roleManager.CreateAsync(superAdminRole);
                }

                // Assign all permissions to Super Admin role
                foreach (var permission in permissions)
                {
                    var existingRolePermission = await context.RolePermissions
                        .FirstOrDefaultAsync(rp => rp.RoleId == superAdminRole.Id && rp.PermissionId == permission.Id);

                    if (existingRolePermission == null)
                    {
                        var rolePermission = new RolePermission
                        {
                            RoleId = superAdminRole.Id,
                            PermissionId = permission.Id,
                            AssignedAt = DateTime.UtcNow
                        };
                        await context.RolePermissions.AddAsync(rolePermission);
                    }
                }

                await context.SaveChangesAsync();

                return Ok(new { 
                    message = "Permissions and role-permission mappings seeded successfully",
                    permissions = permissions.Select(p => p.Name).ToList(),
                    roleId = superAdminRole.Id
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred", error = ex.Message });
            }
        }

        [HttpPost("seed-database")]
        [AllowAnonymous]
        public async Task<IActionResult> SeedDatabase()
        {
            try
            {
                var seedService = HttpContext.RequestServices.GetRequiredService<DatabaseSeedService>();
                await seedService.SeedDatabaseAsync();
                
                return Ok(new { success = true, message = "Database seeded successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = $"Error seeding database: {ex.Message}" });
            }
        }

        [HttpGet("check-database-records")]
        [AllowAnonymous]
        public async Task<IActionResult> CheckDatabaseRecords()
        {
            try
            {
                var context = HttpContext.RequestServices.GetRequiredService<ApplicationDbContext>();
                var userManager = HttpContext.RequestServices.GetRequiredService<UserManager<ApplicationUser>>();

                // Get all users
                var users = await userManager.Users.ToListAsync();
                
                // Get all roles
                var roles = await context.Roles.ToListAsync();
                
                // Get all user roles
                var userRoles = await context.UserRoles.ToListAsync();
                
                // Get all permissions
                var permissions = await context.Permissions.ToListAsync();
                
                // Get all role permissions
                var rolePermissions = await context.RolePermissions.ToListAsync();

                var result = new
                {
                    Users = users.Select(u => new { u.Id, u.Email, u.FirstName, u.LastName }),
                    Roles = roles.Select(r => new { r.Id, r.Name }),
                    UserRoles = userRoles.Select(ur => new { ur.UserId, ur.RoleId }),
                    Permissions = permissions.Select(p => new { p.Id, p.Name }),
                    RolePermissions = rolePermissions.Select(rp => new { rp.RoleId, rp.PermissionId }),
                    Summary = new
                    {
                        TotalUsers = users.Count,
                        TotalRoles = roles.Count,
                        TotalUserRoles = userRoles.Count,
                        TotalPermissions = permissions.Count,
                        TotalRolePermissions = rolePermissions.Count
                    }
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = $"Error checking database records: {ex.Message}" });
            }
        }

        [HttpGet("check-user-permissions")]
        [AllowAnonymous]
        public async Task<IActionResult> CheckUserPermissions()
        {
            try
            {
                var context = HttpContext.RequestServices.GetRequiredService<ApplicationDbContext>();
                var userManager = HttpContext.RequestServices.GetRequiredService<UserManager<ApplicationUser>>();

                var users = await userManager.Users.ToListAsync();
                var userDetails = new List<object>();

                foreach (var user in users)
                {
                    var userRoles = await userManager.GetRolesAsync(user);
                    var userPermissions = new List<string>();

                    // Get permissions for each role
                    foreach (var roleName in userRoles)
                    {
                        var role = await context.Roles.FirstOrDefaultAsync(r => r.Name == roleName);
                        if (role != null)
                        {
                            var rolePerms = await context.RolePermissions
                                .Where(rp => rp.RoleId == role.Id)
                                .Join(context.Permissions, rp => rp.PermissionId, p => p.Id, (rp, p) => p.Name)
                                .ToListAsync();
                            userPermissions.AddRange(rolePerms);
                        }
                    }

                    userDetails.Add(new
                    {
                        UserId = user.Id,
                        Email = user.Email,
                        FirstName = user.FirstName,
                        LastName = user.LastName,
                        Roles = userRoles.ToList(),
                        Permissions = userPermissions.Distinct().ToList()
                    });
                }

                return Ok(new
                {
                    Users = userDetails,
                    Summary = new
                    {
                        TotalUsers = users.Count,
                        UsersWithRoles = userDetails.Count(u => ((dynamic)u).Roles.Count > 0),
                        UsersWithPermissions = userDetails.Count(u => ((dynamic)u).Permissions.Count > 0)
                    }
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = $"Error checking user permissions: {ex.Message}" });
            }
        }

        [HttpGet("check-permissions")]
        [AllowAnonymous]
        public async Task<IActionResult> CheckPermissions()
        {
            try
            {
                var context = HttpContext.RequestServices.GetRequiredService<ApplicationDbContext>();
                
                var permissions = await context.Permissions.ToListAsync();
                var rolePermissions = await context.RolePermissions.ToListAsync();
                
                var result = new
                {
                    Permissions = permissions.Select(p => new { p.Id, p.Name }),
                    RolePermissions = rolePermissions.Select(rp => new { rp.RoleId, rp.PermissionId }),
                    Summary = new
                    {
                        TotalPermissions = permissions.Count,
                        TotalRolePermissions = rolePermissions.Count,
                        PermissionIds = permissions.Select(p => p.Id).ToList(),
                        RolePermissionIds = rolePermissions.Select(rp => rp.PermissionId).Distinct().ToList()
                    }
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = $"Error checking permissions: {ex.Message}" });
            }
        }

        [HttpPost("fix-role-permissions")]
        [AllowAnonymous]
        public async Task<IActionResult> FixRolePermissions()
        {
            try
            {
                var context = HttpContext.RequestServices.GetRequiredService<ApplicationDbContext>();
                
                // Clear existing role permissions
                var existingRolePermissions = await context.RolePermissions.ToListAsync();
                context.RolePermissions.RemoveRange(existingRolePermissions);
                await context.SaveChangesAsync();
                
                // Run the seed service to recreate role permissions
                var seedService = HttpContext.RequestServices.GetRequiredService<DatabaseSeedService>();
                await seedService.SeedDatabaseAsync();
                
                return Ok(new { 
                    success = true, 
                    message = $"Cleared {existingRolePermissions.Count} existing role permissions and reseeded successfully" 
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = $"Error fixing role permissions: {ex.Message}" });
            }
        }

        [HttpGet("check-configuration")]
        [AllowAnonymous]
        public IActionResult CheckConfiguration()
        {
            try
            {
                var result = new
                {
                    Environment = AppConstants.Environment.CurrentEnvironment,
                    IsDevelopment = AppConstants.Environment.IsDevelopmentEnvironment,
                    IsProduction = AppConstants.Environment.IsProductionEnvironment,
                    ConnectionString = AppConstants.Database.ConnectionString,
                    DatabaseServer = AppConstants.Database.Server,
                    DatabaseName = AppConstants.Database.DatabaseName,
                    JwtIssuer = AppConstants.Jwt.ValidIssuer,
                    JwtAudience = AppConstants.Jwt.ValidAudience,
                    EmailFrom = AppConstants.Email.From,
                    EmailServer = AppConstants.Email.SmtpServer,
                    FrontendUrl = AppConstants.AppSettings.FrontendUrl,
                    RateLimitingMaxAttempts = AppConstants.RateLimiting.MaxAttempts,
                    TokenPolicyAccessTokenValidity = AppConstants.TokenPolicy.AccessTokenValidity,
                    PasswordPolicyMinLength = AppConstants.PasswordPolicy.MinLength,
                    SwaggerEnabled = AppConstants.Swagger.Enabled
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = $"Error checking configuration: {ex.Message}" });
            }
        }
    }
}
