using Microsoft.AspNetCore.Identity;
using SecureAuth.APPLICATION.Commands.Admin;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.DOMAIN.Models;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace SecureAuth.APPLICATION.Commands.Admin
{
    public class UpdateRoleCommandHandler : ICommandHandler<UpdateRoleCommand, bool>
    {
        private readonly RoleManager<ApplicationRole> _roleManager;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IActivityLogService _activityLogService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public UpdateRoleCommandHandler(
            RoleManager<ApplicationRole> roleManager,
            IUnitOfWork unitOfWork,
            IActivityLogService activityLogService,
            IHttpContextAccessor httpContextAccessor)
        {
            _roleManager = roleManager;
            _unitOfWork = unitOfWork;
            _activityLogService = activityLogService;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<bool> HandleAsync(UpdateRoleCommand command)
        {
            // Get current user ID from HTTP context (fallback to command if not available)
            var currentUserId = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? command.CurrentUserId
                ?? "System";

            // Find the role to update
            var role = await _roleManager.FindByIdAsync(command.Id);
            if (role == null)
            {
                return false; // Role not found
            }

            // Check if the new name conflicts with an existing role
            if (!string.Equals(role.Name, command.Name, StringComparison.OrdinalIgnoreCase))
            {
                var existingRole = await _roleManager.FindByNameAsync(command.Name);
                if (existingRole != null)
                {
                    return false; // Role name already exists
                }
            }

            // Update role properties
            role.Name = command.Name;
            role.NormalizedName = command.Name.ToUpper();
            role.Description = command.Description;
            role.IsActive = command.IsActive;

            var result = await _roleManager.UpdateAsync(role);
            if (!result.Succeeded)
            {
                return false;
            }

            // Log the activity using the current user ID
            await _activityLogService.LogUserActionAsync(
                currentUserId,
                "UpdateRole",
                "Role",
                role.Id,
                $"Role '{role.Name}' updated successfully");

            await _unitOfWork.SaveChangesAsync();
            return true;
        }
    }
} 
