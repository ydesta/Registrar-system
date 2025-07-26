using SecureAuth.APPLICATION.Commands.Admin;
using SecureAuth.APPLICATION.Interfaces;

namespace SecureAuth.APPLICATION.Commands.Admin
{
    public class RemovePermissionsFromRoleCommandHandler : ICommandHandler<RemovePermissionsFromRoleCommand, bool>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IActivityLogService _activityLogService;

        public RemovePermissionsFromRoleCommandHandler(
            IUnitOfWork unitOfWork,
            IActivityLogService activityLogService)
        {
            _unitOfWork = unitOfWork;
            _activityLogService = activityLogService;
        }

        public async Task<bool> HandleAsync(RemovePermissionsFromRoleCommand command)
        {
            // Validate role exists
            var role = await _unitOfWork.Roles.GetByIdAsync(command.RoleId);
            if (role == null)
            {
                return false; // Role not found
            }

            // Check if trying to remove critical permissions from admin role
            if (role.Name.Equals("Admin", StringComparison.OrdinalIgnoreCase))
            {
                var criticalPermissions = new[] { "System.Admin", "User.Manage", "Role.Manage" };
                if (command.PermissionIds.Any(p => criticalPermissions.Contains(p)))
                {
                    return false; // Cannot remove critical permissions from admin role
                }
            }

            // Remove permissions from role
            var success = await _unitOfWork.RolePermissions.RemovePermissionsFromRoleAsync(
                command.RoleId, 
                command.PermissionIds);

            if (!success)
            {
                return false;
            }

            // Log the activity
            await _activityLogService.LogUserActionAsync(
                "System",
                "RemovePermissionsFromRole",
                "Role",
                command.RoleId,
                $"Removed {command.PermissionIds.Count} permissions from role '{role.Name}'");

            await _unitOfWork.SaveChangesAsync();
            return true;
        }
    }
} 
