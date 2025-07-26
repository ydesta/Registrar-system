using Microsoft.AspNetCore.Identity;
using SecureAuth.APPLICATION.Commands.Admin;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.DOMAIN.Models;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace SecureAuth.APPLICATION.Commands.Admin
{
    public class DeleteRoleCommandHandler : ICommandHandler<DeleteRoleCommand, bool>
    {
        private readonly RoleManager<ApplicationRole> _roleManager;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IActivityLogService _activityLogService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public DeleteRoleCommandHandler(
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

        public async Task<bool> HandleAsync(DeleteRoleCommand command)
        {
            // Get current user ID from HTTP context (fallback to command if not available)
            var currentUserId = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? command.CurrentUserId
                ?? "System";

            // Find the role to delete
            var role = await _roleManager.FindByIdAsync(command.Id);
            if (role == null)
            {
                return false; // Role not found
            }

            // Check if role is in use (has users assigned)
            var usersInRole = await _unitOfWork.Users.GetUsersInRoleByIdAsync(command.Id);
            if (usersInRole.Any())
            {
                return false; // Cannot delete role with assigned users
            }

            // Check if it's a system role (prevent deletion of critical roles)
            if (role.Name.Equals("Admin", StringComparison.OrdinalIgnoreCase) ||
                role.Name.Equals("System", StringComparison.OrdinalIgnoreCase))
            {
                return false; // Cannot delete system roles
            }

            var result = await _roleManager.DeleteAsync(role);
            if (!result.Succeeded)
            {
                return false;
            }

            // Log the activity using the current user ID
            await _activityLogService.LogUserActionAsync(
                currentUserId,
                "DeleteRole",
                "Role",
                role.Id,
                $"Role '{role.Name}' deleted successfully");

            await _unitOfWork.SaveChangesAsync();
            return true;
        }
    }
} 
