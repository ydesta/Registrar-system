using Microsoft.AspNetCore.Identity;
using SecureAuth.APPLICATION.Commands.User;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.DOMAIN.Models;

namespace SecureAuth.APPLICATION.Commands.User
{
    public class UpdateUserCommandHandler : ICommandHandler<UpdateUserCommand, bool>
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IActivityLogService _activityLogService;
        private readonly IEmailService _emailService;

        public UpdateUserCommandHandler(
            UserManager<ApplicationUser> userManager,
            IUnitOfWork unitOfWork,
            IActivityLogService activityLogService,
            IEmailService emailService)
        {
            _userManager = userManager;
            _unitOfWork = unitOfWork;
            _activityLogService = activityLogService;
            _emailService = emailService;
        }

        public async Task<bool> HandleAsync(UpdateUserCommand command)
        {
            var user = await _userManager.FindByIdAsync(command.UserId);
            if (user == null)
                return false;

            var changes = new List<string>();
            bool usernameChanged = false;

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
                
                user.UserName = command.UserName;
                changes.Add("UserName");
                usernameChanged = true;
            }

            if (command.IsActive.HasValue && user.IsActive != command.IsActive.Value)
            {
                user.IsActive = command.IsActive.Value;
                changes.Add("IsActive");
            }

            // Update role if specified
            if (!string.IsNullOrEmpty(command.RoleName))
            {
                var currentRoles = await _userManager.GetRolesAsync(user);
                if (!currentRoles.Contains(command.RoleName))
                {
                    // Remove current roles and add new role
                    await _userManager.RemoveFromRolesAsync(user, currentRoles);
                    await _userManager.AddToRoleAsync(user, command.RoleName);
                    changes.Add("Role");
                }
            }

            if (changes.Any())
            {
                var result = await _userManager.UpdateAsync(user);
                if (result.Succeeded)
                {
                    await _activityLogService.LogUserActionAsync(
                        user.Id,
                        "UserUpdated",
                        "User",
                        user.Id,
                        $"Updated fields: {string.Join(", ", changes)}");

                    // Send email notification if username was changed
                    if (usernameChanged)
                    {
                        try
                        {
                            await _emailService.SendUpdatedCredentialsAsync(
                                user.Email,
                                user.UserName,
                                user.FirstName,
                                user.LastName,
                                "Username");
                        }
                        catch (Exception ex)
                        {
                            // Log the error but don't fail the update
                            // The admin can manually send notification later
                        }
                    }

                    await _unitOfWork.SaveChangesAsync();
                    return true;
                }
            }

            return false;
        }
    }
} 
