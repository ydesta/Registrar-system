using Microsoft.AspNetCore.Identity;
using SecureAuth.DOMAIN.Models;
using SecureAuth.APPLICATION.DTOs;
using System.Threading.Tasks;

namespace SecureAuth.APPLICATION.Commands.User
{
    public class UpdateUserRoleCommandHandler : ICommandHandler<UpdateUserRoleCommand, Result>
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<ApplicationRole> _roleManager;

        public UpdateUserRoleCommandHandler(UserManager<ApplicationUser> userManager, RoleManager<ApplicationRole> roleManager)
        {
            _userManager = userManager;
            _roleManager = roleManager;
        }

        public async Task<Result> HandleAsync(UpdateUserRoleCommand command)
        {
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