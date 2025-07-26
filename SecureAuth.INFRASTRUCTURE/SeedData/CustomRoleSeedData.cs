using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SecureAuth.DOMAIN.Models;
using SecureAuth.DOMAIN.Models.Security;
using SecureAuth.INFRASTRUCTURE.Data;

namespace SecureAuth.INFRASTRUCTURE.SeedData
{
    public static class CustomRoleSeedData
    {
        public static async Task SeedRolesAsync(RoleManager<IdentityRole> roleManager)
        {
            var roles = new[]
            {
                new { Name = "Admin", Description = "System administrator with full access" },
                new { Name = "Student", Description = "Enrolled students with academic access" },
                new { Name = "Instructor", Description = "Teaching staff with course management access" },
                new { Name = "Finance", Description = "Financial staff with payment and billing access" },
                new { Name = "Applicant", Description = "Prospective students applying for admission" },
                new { Name = "ApprovedApplicant", Description = "Approved applicants ready for enrollment" }
            };

            foreach (var role in roles)
            {
                if (!await roleManager.RoleExistsAsync(role.Name))
                {
                    await roleManager.CreateAsync(new IdentityRole(role.Name));
                    Console.WriteLine($"Created role: {role.Name} - {role.Description}");
                }
            }
        }

        public static async Task SeedRolePermissionsAsync(
            RoleManager<IdentityRole> roleManager,
            ApplicationDbContext context)
        {
            // Define permissions for each role
            var rolePermissions = new Dictionary<string, string[]>
            {
                ["Admin"] = new[] { "view", "edit", "request", "approve", "pay", "enroll" },
                ["Student"] = new[] { "view", "request", "enroll" },
                ["Instructor"] = new[] { "view", "edit", "request" },
                ["Finance"] = new[] { "view", "edit", "request", "pay" },
                ["Applicant"] = new[] { "view", "request" },
                ["ApprovedApplicant"] = new[] { "view", "request", "enroll" }
            };

            foreach (var rolePermission in rolePermissions)
            {
                var role = await roleManager.FindByNameAsync(rolePermission.Key);
                if (role != null)
                {
                    foreach (var permissionName in rolePermission.Value)
                    {
                        var permission = await context.Permissions
                            .FirstOrDefaultAsync(p => p.Name == permissionName);

                        if (permission != null)
                        {
                            var existingRolePermission = await context.RolePermissions
                                .FirstOrDefaultAsync(rp => rp.RoleId == role.Id && rp.PermissionId == permission.Id);

                            if (existingRolePermission == null)
                            {
                                var rolePermissionEntity = new RolePermission
                                {
                                    RoleId = role.Id,
                                    PermissionId = permission.Id,
                                    AssignedAt = DateTime.UtcNow
                                };

                                context.RolePermissions.Add(rolePermissionEntity);
                                Console.WriteLine($"Assigned permission '{permissionName}' to role '{rolePermission.Key}'");
                            }
                        }
                    }
                }
            }

            await context.SaveChangesAsync();
        }

        public static async Task SeedSampleUsersAsync(
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager)
        {
            // Sample Admin User
            var adminUser = new ApplicationUser
            {
                UserName = "admin@example.com",
                Email = "admin@example.com",
                FirstName = "System",
                LastName = "Administrator",
                EmailConfirmed = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            if (await userManager.FindByEmailAsync(adminUser.Email) == null)
            {
                var result = await userManager.CreateAsync(adminUser, "Admin123!");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(adminUser, "Admin");
                    Console.WriteLine("Created sample admin user: admin@example.com");
                }
            }

            // Sample Student User
            var studentUser = new ApplicationUser
            {
                UserName = "student@example.com",
                Email = "student@example.com",
                FirstName = "John",
                LastName = "Student",
                EmailConfirmed = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            if (await userManager.FindByEmailAsync(studentUser.Email) == null)
            {
                var result = await userManager.CreateAsync(studentUser, "Student123!");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(studentUser, "Student");
                    Console.WriteLine("Created sample student user: student@example.com");
                }
            }

            // Sample Instructor User
            var instructorUser = new ApplicationUser
            {
                UserName = "instructor@example.com",
                Email = "instructor@example.com",
                FirstName = "Dr. Jane",
                LastName = "Instructor",
                EmailConfirmed = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            if (await userManager.FindByEmailAsync(instructorUser.Email) == null)
            {
                var result = await userManager.CreateAsync(instructorUser, "Instructor123!");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(instructorUser, "Instructor");
                    Console.WriteLine("Created sample instructor user: instructor@example.com");
                }
            }

            // Sample Finance User
            var financeUser = new ApplicationUser
            {
                UserName = "finance@example.com",
                Email = "finance@example.com",
                FirstName = "Mike",
                LastName = "Finance",
                EmailConfirmed = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            if (await userManager.FindByEmailAsync(financeUser.Email) == null)
            {
                var result = await userManager.CreateAsync(financeUser, "Finance123!");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(financeUser, "Finance");
                    Console.WriteLine("Created sample finance user: finance@example.com");
                }
            }

            // Sample Applicant User
            var applicantUser = new ApplicationUser
            {
                UserName = "applicant@example.com",
                Email = "applicant@example.com",
                FirstName = "Sarah",
                LastName = "Applicant",
                EmailConfirmed = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            if (await userManager.FindByEmailAsync(applicantUser.Email) == null)
            {
                var result = await userManager.CreateAsync(applicantUser, "Applicant123!");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(applicantUser, "Applicant");
                    Console.WriteLine("Created sample applicant user: applicant@example.com");
                }
            }

            // Sample Approved Applicant User
            var approvedApplicantUser = new ApplicationUser
            {
                UserName = "approved@example.com",
                Email = "approved@example.com",
                FirstName = "Tom",
                LastName = "Approved",
                EmailConfirmed = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            if (await userManager.FindByEmailAsync(approvedApplicantUser.Email) == null)
            {
                var result = await userManager.CreateAsync(approvedApplicantUser, "Approved123!");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(approvedApplicantUser, "ApprovedApplicant");
                    Console.WriteLine("Created sample approved applicant user: approved@example.com");
                }
            }
        }
    }
} 
