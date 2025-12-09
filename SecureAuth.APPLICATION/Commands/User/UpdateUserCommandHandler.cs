using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Http;
using SecureAuth.APPLICATION.Commands.User;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.DOMAIN.Models;
using System.Security.Claims;

namespace SecureAuth.APPLICATION.Commands.User
{
    public class UpdateUserCommandHandler : ICommandHandler<UpdateUserCommand, bool>
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IActivityLogService _activityLogService;
        private readonly IEmailService _emailService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public UpdateUserCommandHandler(
            UserManager<ApplicationUser> userManager,
            IUnitOfWork unitOfWork,
            IActivityLogService activityLogService,
            IEmailService emailService,
            IHttpContextAccessor httpContextAccessor)
        {
            _userManager = userManager;
            _unitOfWork = unitOfWork;
            _activityLogService = activityLogService;
            _emailService = emailService;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<bool> HandleAsync(UpdateUserCommand command)
        {
            var user = await _userManager.FindByIdAsync(command.UserId);
            if (user == null)
                return false;

            // Security fix: Get current user and validate permissions
            var currentUserId = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var currentUser = !string.IsNullOrEmpty(currentUserId) ? await _userManager.FindByIdAsync(currentUserId) : null;
            var isSuperAdmin = currentUser != null && await _userManager.IsInRoleAsync(currentUser, "Super Admin");

            var changes = new List<string>();
            bool usernameChanged = false;
            var hasPrivilegedChanges = false;

            // Update basic properties
            if (!string.IsNullOrEmpty(command.FirstName) && user.FirstName != command.FirstName)
            {
                user.FirstName = command.FirstName;
                changes.Add("FirstName");
            }

            if (!string.IsNullOrEmpty(command.LastName) && user.LastName != command.LastName)
            {
                user.LastName = command.LastName;
                changes.Add("LastName");
            }

            if (!string.IsNullOrEmpty(command.PhoneNumber) && user.PhoneNumber != command.PhoneNumber)
            {
                user.PhoneNumber = command.PhoneNumber;
                changes.Add("PhoneNumber");
            }

            if (!string.IsNullOrEmpty(command.UserName) && user.UserName != command.UserName)
            {
                // Check if username is already taken
                var existingUser = await _userManager.FindByNameAsync(command.UserName);
                if (existingUser != null && existingUser.Id != user.Id)
                {
                    return false; // Username already exists
                }
                
                //user.UserName = command.UserName;
                changes.Add("UserName");
                usernameChanged = true;
            }

            if (command.IsActive.HasValue && user.IsActive != command.IsActive.Value)
            {
                // Security fix: Only Super Admins can modify IsActive status
                if (!isSuperAdmin)
                {
                    throw new UnauthorizedAccessException("Only Super Admins can modify user active status.");
                }
                user.IsActive = command.IsActive.Value;
                changes.Add("IsActive");
                hasPrivilegedChanges = true;
            }

            // Update role if specified
            if (!string.IsNullOrEmpty(command.RoleName))
            {
                // Security fix: Only Super Admins can modify roles
                if (!isSuperAdmin)
                {
                    throw new UnauthorizedAccessException("Only Super Admins can modify user roles.");
                }
                
                var currentRoles = await _userManager.GetRolesAsync(user);
                if (!currentRoles.Contains(command.RoleName))
                {
                    // Remove current roles and add new role
                    await _userManager.RemoveFromRolesAsync(user, currentRoles);
                    await _userManager.AddToRoleAsync(user, command.RoleName);
                    changes.Add("Role");
                    hasPrivilegedChanges = true;
                }
            }

            if (changes.Any())
            {
                var result = await _userManager.UpdateAsync(user);
                if (result.Succeeded)
                {
                    // Security fix: Log who made the changes
                    var actorId = currentUserId ?? "System";
                    await _activityLogService.LogUserActionAsync(
                        actorId,
                        hasPrivilegedChanges ? "UserUpdatedByAdmin" : "UserUpdated",
                        "User",
                        user.Id,
                        $"Updated fields: {string.Join(", ", changes)}");

                    // Send email notification if username was changed
                    //if (usernameChanged)
                    //{
                    //    try
                    //    {
                    //        await _emailService.SendUpdatedCredentialsAsync(
                    //            user.Email,
                    //            user.UserName,
                    //            user.FirstName,
                    //            user.LastName,
                    //            "Username");
                    //    }
                    //    catch (Exception ex)
                    //    {
                    //        // Log the error but don't fail the update
                    //        // The admin can manually send notification later
                    //    }
                    //}

                    await _unitOfWork.SaveChangesAsync();
                    return true;
                }
                else
                {
                    return false; // Update failed
                }
            }

            // If no changes were made to basic fields, return true (success)
            // This handles cases where only email changes (handled by separate endpoint)
            return true;
        }
    }
} 
