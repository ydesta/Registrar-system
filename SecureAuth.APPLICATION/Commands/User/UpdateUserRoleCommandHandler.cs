using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Http;
using SecureAuth.DOMAIN.Models;
using SecureAuth.APPLICATION.DTOs;
using System.Threading.Tasks;
using System.Security.Claims;

namespace SecureAuth.APPLICATION.Commands.User
{
    public class UpdateUserRoleCommandHandler : ICommandHandler<UpdateUserRoleCommand, Result>
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<ApplicationRole> _roleManager;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public UpdateUserRoleCommandHandler(
            UserManager<ApplicationUser> userManager, 
            RoleManager<ApplicationRole> roleManager,
            IHttpContextAccessor httpContextAccessor)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<Result> HandleAsync(UpdateUserRoleCommand command)
        {
            // Security fix: Get current user and validate Super Admin permission
            var currentUserId = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(currentUserId))
            {
                return Result.Failure("User not authenticated.");
            }

            var currentUser = await _userManager.FindByIdAsync(currentUserId);
            if (currentUser == null)
            {
                return Result.Failure("Current user not found.");
            }

            var isSuperAdmin = await _userManager.IsInRoleAsync(currentUser, "Super Admin");
            if (!isSuperAdmin)
            {
                return Result.Failure("Only Super Admins can modify user roles.");
            }

            // Security fix: Prevent self-promotion to Admin roles
            if (currentUserId == command.UserId && command.Role.Contains("Admin", StringComparison.OrdinalIgnoreCase))
            {
                return Result.Failure("Cannot self-promote to Admin roles for security reasons.");
            }

            var user = await _userManager.FindByIdAsync(command.UserId);
            if (user == null)
                return Result.Failure("User not found.");

            var currentRoles = await _userManager.GetRolesAsync(user);
            var removeResult = await _userManager.RemoveFromRolesAsync(user, currentRoles);
            if (!removeResult.Succeeded)
                return Result.Failure("Failed to remove user roles.");

            if (!await _roleManager.RoleExistsAsync(command.Role))
            {
                var roleResult = await _roleManager.CreateAsync(new ApplicationRole { Name = command.Role });
                if (!roleResult.Succeeded)
                    return Result.Failure("Failed to create new role.");
            }

            var addResult = await _userManager.AddToRoleAsync(user, command.Role);
            if (!addResult.Succeeded)
                return Result.Failure("Failed to add user to new role.");

            return Result.Success();
        }
    }
} 