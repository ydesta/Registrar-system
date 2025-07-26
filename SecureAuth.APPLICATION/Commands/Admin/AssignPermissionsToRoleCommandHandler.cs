using SecureAuth.APPLICATION.Commands.Admin;
using SecureAuth.APPLICATION.Interfaces;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace SecureAuth.APPLICATION.Commands.Admin
{
    public class AssignPermissionsToRoleCommandHandler : ICommandHandler<AssignPermissionsToRoleCommand, bool>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IActivityLogService _activityLogService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public AssignPermissionsToRoleCommandHandler(
            IUnitOfWork unitOfWork,
            IActivityLogService activityLogService,
            IHttpContextAccessor httpContextAccessor)
        {
            _unitOfWork = unitOfWork;
            _activityLogService = activityLogService;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<bool> HandleAsync(AssignPermissionsToRoleCommand command)
        {
            try
            {
                // Get current user ID from HTTP context (fallback to command if not available)
                var currentUserId = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? command.CurrentUserId
                    ?? "System";
                // Validate role exists
                var role = await _unitOfWork.Roles.GetByIdAsync(command.RoleId);
                if (role == null)
                {
                    return false; // Role not found
                }

                // Validate permissions exist
                var permissions = await _unitOfWork.Permissions.GetByIdsAsync(command.PermissionIds);
                if (permissions.Count != command.PermissionIds.Count)
                {
                    return false; // Some permissions not found
                }

                // Assign permissions to role
                var success = await _unitOfWork.RolePermissions.AssignPermissionsToRoleAsync(
                    command.RoleId,
                    command.PermissionIds);

                if (!success)
                {
                    return false;
                }

               

                // Log the activity using the current user ID
                await _activityLogService.LogUserActionAsync(
                    currentUserId,
                    "AssignPermissionsToRole",
                    "Role",
                    command.RoleId,
                    $"Assigned {command.PermissionIds.Count} permissions to role '{role.Name}'");

                await _unitOfWork.SaveChangesAsync();
                return true;
            }
            catch(Exception ex)
            {
                throw new Exception(ex.Message);
            }
           
        }
    }
} 
