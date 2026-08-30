using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using SecureAuth.APPLICATION.Commands;
using SecureAuth.DOMAIN.Models;

namespace SecureAuth.APPLICATION.Commands.User
{
    public class AdminUpdateUserRolesCommandHandler : ICommandHandler<AdminUpdateUserRolesCommand, AdminUpdateUserRolesResult>
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<ApplicationRole> _roleManager;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public AdminUpdateUserRolesCommandHandler(
            UserManager<ApplicationUser> userManager,
            RoleManager<ApplicationRole> roleManager,
            IHttpContextAccessor httpContextAccessor)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<AdminUpdateUserRolesResult> HandleAsync(AdminUpdateUserRolesCommand command)
        {
            var currentUserId = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(currentUserId))
            {
                return Fail("User not authenticated.");
            }

            var currentUser = await _userManager.FindByIdAsync(currentUserId);
            if (currentUser == null)
            {
                return Fail("Current user not found.");
            }

            var isSuperAdmin = await _userManager.IsInRoleAsync(currentUser, "Super Admin");
            var isAdmin = await _userManager.IsInRoleAsync(currentUser, "Admin");
            var isReviewer = await _userManager.IsInRoleAsync(currentUser, "Reviewer");
            if (!isSuperAdmin && !isAdmin && !isReviewer)
            {
                return Fail("Only Admin, Reviewer, or Super Admin can modify user roles.");
            }

            var requestedRoles = (command.Roles ?? new List<string>())
                .Where(r => !string.IsNullOrWhiteSpace(r))
                .Select(r => r.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (isReviewer && !isSuperAdmin && !isAdmin)
            {
                if (requestedRoles.Count != 1 ||
                    !string.Equals(requestedRoles[0], "ApprovedApplicant", StringComparison.OrdinalIgnoreCase))
                {
                    return Fail("Reviewers can only assign the ApprovedApplicant role.");
                }
            }

            if (currentUserId == command.UserId &&
                requestedRoles.Any(r => r.Contains("Admin", StringComparison.OrdinalIgnoreCase)))
            {
                return Fail("Cannot self-promote to Admin roles for security reasons.");
            }

            var user = await _userManager.FindByIdAsync(command.UserId);
            if (user == null)
            {
                return Fail("User not found.");
            }

            foreach (var roleName in requestedRoles)
            {
                if (await _roleManager.RoleExistsAsync(roleName))
                {
                    continue;
                }

                var createResult = await _roleManager.CreateAsync(new ApplicationRole { Name = roleName });
                if (!createResult.Succeeded)
                {
                    return Fail($"Failed to create role '{roleName}'.");
                }
            }

            var currentRoles = await _userManager.GetRolesAsync(user);
            if (currentRoles.Count > 0)
            {
                var removeResult = await _userManager.RemoveFromRolesAsync(user, currentRoles);
                if (!removeResult.Succeeded)
                {
                    return Fail("Failed to remove existing user roles.");
                }
            }

            if (requestedRoles.Count > 0)
            {
                var addResult = await _userManager.AddToRolesAsync(user, requestedRoles);
                if (!addResult.Succeeded)
                {
                    return Fail("Failed to assign selected roles.");
                }
            }

            return new AdminUpdateUserRolesResult
            {
                Success = true,
                Message = "User roles updated successfully."
            };
        }

        private static AdminUpdateUserRolesResult Fail(string message) =>
            new() { Success = false, Message = message };
    }
}
