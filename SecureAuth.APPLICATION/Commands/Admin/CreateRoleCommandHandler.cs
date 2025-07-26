using Microsoft.AspNetCore.Identity;
using SecureAuth.APPLICATION.Commands.Admin;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.DOMAIN.Models;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace SecureAuth.APPLICATION.Commands.Admin
{
    public class CreateRoleCommandHandler : ICommandHandler<CreateRoleCommand, string>
    {
        private readonly RoleManager<ApplicationRole> _roleManager;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IActivityLogService _activityLogService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CreateRoleCommandHandler(
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

        public async Task<string> HandleAsync(CreateRoleCommand command)
        {
            // Get current user ID from HTTP context (fallback to command if not available)
            var currentUserId = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? command.CurrentUserId
                ?? "System";

            // Check if role already exists
            var existingRole = await _roleManager.FindByNameAsync(command.Name);
            if (existingRole != null)
            {
                return existingRole.Id; // Role already exists
            }

            // Create new role
            var newRole = new ApplicationRole
            {
                Name = command.Name,
                NormalizedName = command.Name.ToUpper(),
                Description = command.Description,
                IsActive = command.IsActive
            };

            await _unitOfWork.Roles.AddAsync(newRole);
            await _unitOfWork.SaveChangesAsync();

            // Log the activity using the current user ID
            await _activityLogService.LogUserActionAsync(
                currentUserId,
                "CreateRole",
                "Role",
                newRole.Id,
                $"Role '{command.Name}' created successfully");

            return newRole.Id;
        }
    }
} 
