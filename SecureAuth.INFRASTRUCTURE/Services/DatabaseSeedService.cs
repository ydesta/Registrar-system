using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SecureAuth.DOMAIN.Models;
using SecureAuth.DOMAIN.Models.Security;
using SecureAuth.INFRASTRUCTURE.Data;
using SecureAuth.INFRASTRUCTURE.SeedData;

namespace SecureAuth.INFRASTRUCTURE.Services
{
    public class DatabaseSeedService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<DatabaseSeedService> _logger;
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public DatabaseSeedService(
            IServiceProvider serviceProvider,
            ILogger<DatabaseSeedService> logger,
            ApplicationDbContext context,
            IConfiguration configuration)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
            _context = context;
            _configuration = configuration;
        }

        public async Task SeedDatabaseAsync()
        {
            try
            {
                _logger.LogInformation("Starting database seeding...");

                // Seed roles
                await SeedRolesAsync();

                // Seed permissions
                await SeedPermissionsAsync();

                // Seed role permissions
                await SeedRolePermissionsAsync();

                // Seed super admin user
                await SeedSuperAdminAsync();

                // Seed password policies
                await SeedPasswordPoliciesAsync();

                // Seed system configuration
                await SeedSystemConfigurationAsync();

                // Seed security threats
                await SeedSecurityThreatsAsync();

                _logger.LogInformation("Database seeding completed successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during database seeding.");
                throw;
            }
        }

        private async Task SeedRolesAsync()
        {
            var roles = RoleSeedData.GetRoles();

            foreach (var role in roles)
            {
                var existingRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == role.Name);
                if (existingRole == null)
                {
                    await _context.Roles.AddAsync(role);
                    _logger.LogInformation("Role '{RoleName}' created with ID '{RoleId}'.", role.Name, role.Id);
                }
                else
                {
                    _logger.LogInformation("Role '{RoleName}' already exists with ID '{RoleId}'.", role.Name, existingRole.Id);
                }
            }
            await _context.SaveChangesAsync();
        }

        private async Task SeedPermissionsAsync()
        {
            try
            {
                var permissions = PermissionSeedData.GetPermissions();

                foreach (var permission in permissions)
                {
                    var existingPermission = await _context.Permissions.FirstOrDefaultAsync(p => p.Name == permission.Name);
                    if (existingPermission == null)
                    {
                        await _context.Permissions.AddAsync(permission);
                        _logger.LogInformation($"Permission '{permission.Name}' created successfully.");
                    }
                    else
                    {
                        // Update existing permission with category and description if they're missing
                        if (string.IsNullOrEmpty(existingPermission.Category) || string.IsNullOrEmpty(existingPermission.Description))
                        {
                            existingPermission.Category = permission.Category;
                            existingPermission.Description = permission.Description;
                            _context.Permissions.Update(existingPermission);
                            _logger.LogInformation($"Permission '{permission.Name}' updated with category and description.");
                        }
                        else
                        {
                            _logger.LogInformation($"Permission '{permission.Name}' already exists with complete data.");
                        }
                    }
                }

                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error seeding permissions");
                throw;
            }
        }

        private async Task SeedRolePermissionsAsync()
        {
            try
            {
                // Get existing permissions from database
                var existingPermissions = await _context.Permissions.ToListAsync();
                var permissionNameToId = existingPermissions.ToDictionary(p => p.Name, p => p.Id);

                // Get existing roles from database
                var existingRoles = await _context.Roles.ToListAsync();
                var roleNameToId = existingRoles.ToDictionary(r => r.Name, r => r.Id);

                // Define role-permission mappings
                var rolePermissionMappings = new[]
                {
                    // Super Admin gets all permissions
                    ("Super Admin", "View"),
                    ("Super Admin", "Request"),
                    ("Super Admin", "Edit"),
                    ("Super Admin", "Approve"),
                    ("Super Admin", "Pay"),
                    ("Super Admin", "Enroll"),
                    // Student
                    ("Student", "View"),
                    ("Student", "Request"),
                    ("Student", "Enroll"),
                    // Instructor
                    ("Instructor", "View"),
                    ("Instructor", "Edit"),
                    ("Instructor", "Enroll"),
                    // Finance
                    ("Finance", "View"),
                    ("Finance", "Pay"),
                    // Applicant
                    ("Applicant", "View"),
                    ("Applicant", "Request"),
                    // ApprovedApplicant
                    ("ApprovedApplicant", "View"),
                    ("ApprovedApplicant", "Approve")
                };

                foreach (var (roleName, permissionName) in rolePermissionMappings)
                {
                    if (roleNameToId.TryGetValue(roleName, out var roleId) && 
                        permissionNameToId.TryGetValue(permissionName, out var permissionId))
                    {
                        var existingRolePermission = await _context.RolePermissions
                            .FirstOrDefaultAsync(rp => rp.RoleId == roleId && rp.PermissionId == permissionId);

                        if (existingRolePermission == null)
                        {
                            var rolePermission = new RolePermission
                            {
                                RoleId = roleId,
                                PermissionId = permissionId
                            };
                            await _context.RolePermissions.AddAsync(rolePermission);
                            _logger.LogInformation($"Role-Permission mapping created: {roleName} -> {permissionName}");
                        }
                        else
                        {
                            _logger.LogInformation($"Role-Permission mapping already exists: {roleName} -> {permissionName}");
                        }
                    }
                    else
                    {
                        _logger.LogWarning($"Role '{roleName}' or Permission '{permissionName}' not found in database");
                    }
                }

                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error seeding role permissions");
                throw;
            }
        }

        private async Task SeedSuperAdminAsync()
        {
            try
            {
                var userManager = _serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
                var roleManager = _serviceProvider.GetRequiredService<RoleManager<ApplicationRole>>();

                // Security fix: Read credentials from configuration instead of hardcoded values
                string superAdminEmail = _configuration["SeedData:SuperAdminEmail"] 
                    ?? throw new InvalidOperationException("SuperAdminEmail not configured in SeedData section");
                
                string superAdminPassword = _configuration["SeedData:SuperAdminPassword"] 
                    ?? throw new InvalidOperationException("SuperAdminPassword not configured in SeedData section");

                // Log that seeding is happening (without logging the password)
                _logger.LogInformation("Seeding Super Admin user: {Email}", superAdminEmail);

                // Ensure Super Admin role exists
                var superAdminRole = await roleManager.FindByNameAsync("Super Admin");
                if (superAdminRole == null)
                {
                    superAdminRole = new ApplicationRole 
                    { 
                        Id = Guid.NewGuid().ToString(),
                        Name = "Super Admin", 
                        NormalizedName = "SUPER ADMIN" 
                    };
                    await roleManager.CreateAsync(superAdminRole);
                    _logger.LogInformation("Super Admin role created with ID: {RoleId}", superAdminRole.Id);
                }

                // Ensure Super Admin user exists
                var superAdmin = await userManager.FindByEmailAsync(superAdminEmail);
                if (superAdmin == null)
                {
                    superAdmin = new ApplicationUser
                    {
                        UserName = superAdminEmail,
                        Email = superAdminEmail,
                        EmailConfirmed = true,
                        FirstName = "Super",
                        LastName = "Admin",
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        PhoneNumber = "+1234567890",
                        PhoneNumberConfirmed = true
                    };

                    var result = await userManager.CreateAsync(superAdmin, superAdminPassword);
                    if (result.Succeeded)
                    {
                        await userManager.AddToRoleAsync(superAdmin, "Super Admin");
                        _logger.LogInformation($"Super Admin user created successfully: {superAdminEmail}");
                    }
                    else
                    {
                        _logger.LogWarning($"Failed to create Super Admin user: {string.Join(", ", result.Errors.Select(e => e.Description))}");
                    }
                }
                else
                {
                    _logger.LogInformation($"Super Admin user already exists: {superAdminEmail}");
                    
                    // Ensure user is assigned to Super Admin role
                    var userRoles = await userManager.GetRolesAsync(superAdmin);
                    if (!userRoles.Contains("Super Admin"))
                    {
                        await userManager.AddToRoleAsync(superAdmin, "Super Admin");
                        _logger.LogInformation($"Super Admin role assigned to existing user: {superAdminEmail}");
                    }
                    else
                    {
                        _logger.LogInformation($"Super Admin role already assigned to user: {superAdminEmail}");
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error seeding super admin user");
                throw;
            }
        }

        private async Task SeedSystemConfigurationAsync()
        {
            try
            {
                // Seed default system configuration
                var defaultConfigs = new[]
                {
                    new SystemConfiguration
                    {
                        Id = Guid.NewGuid().ToString(),
                        Key = "SystemName",
                        Value = "SecureAuth System",
                        Description = "System name",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                        UpdatedBy = "System",
                        IsActive = true
                    },
                    new SystemConfiguration
                    {
                        Id = Guid.NewGuid().ToString(),
                        Key = "MaxLoginAttempts",
                        Value = "5",
                        Description = "Maximum login attempts before lockout",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                        UpdatedBy = "System",
                        IsActive = true
                    },
                    new SystemConfiguration
                    {
                        Id = Guid.NewGuid().ToString(),
                        Key = "SessionTimeoutMinutes",
                        Value = "30",
                        Description = "Session timeout in minutes",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                        UpdatedBy = "System",
                        IsActive = true
                    }
                };

                foreach (var config in defaultConfigs)
                {
                    var existingConfig = await _context.SystemConfigurations
                        .FirstOrDefaultAsync(sc => sc.Key == config.Key);

                    if (existingConfig == null)
                    {
                        await _context.SystemConfigurations.AddAsync(config);
                        _logger.LogInformation($"System configuration '{config.Key}' created successfully.");
                    }
                    else
                    {
                        _logger.LogInformation($"System configuration '{config.Key}' already exists.");
                    }
                }

                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error seeding system configuration");
                throw;
            }
        }

        private async Task SeedSecurityThreatsAsync()
        {
            try
            {
                var securityThreats = SecurityThreatSeedData.GetSecurityThreats();

                foreach (var threat in securityThreats)
                {
                    var existingThreat = await _context.SecurityThreats
                        .FirstOrDefaultAsync(st => st.ThreatType == threat.ThreatType && 
                                                   st.SourceIp == threat.SourceIp && 
                                                   st.CreatedAt.Date == threat.CreatedAt.Date);

                    if (existingThreat == null)
                    {
                        await _context.SecurityThreats.AddAsync(threat);
                        _logger.LogInformation($"Security threat '{threat.ThreatType}' created successfully.");
                    }
                    else
                    {
                        _logger.LogInformation($"Security threat '{threat.ThreatType}' already exists.");
                    }
                }

                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error seeding security threats");
                throw;
            }
        }

        private async Task SeedPasswordPoliciesAsync()
        {
            try
            {
                var existingPolicy = await _context.PasswordPolicies.FirstOrDefaultAsync();
                if (existingPolicy == null)
                {
                    var defaultPolicy = new PasswordPolicy
                    {
                        Id = Guid.NewGuid().ToString(),
                        MinLength = 8,
                        RequireUppercase = true,
                        RequireLowercase = true,
                        RequireDigit = true,
                        RequireSpecialCharacter = true,
                        MaxFailedAttempts = 5,
                        LockoutDuration = 15,
                        PasswordHistorySize = 5,
                        MaxAgeDays = 90,
                        PreventCommonPasswords = true,
                        HistoryCount = 5,
                        CreatedAt = DateTime.UtcNow
                    };

                    await _context.PasswordPolicies.AddAsync(defaultPolicy);
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Default password policy created successfully.");
                }
                else
                {
                    _logger.LogInformation("Password policy already exists.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error seeding password policies");
                throw;
            }
        }
    }
} 