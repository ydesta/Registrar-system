using Microsoft.AspNetCore.Identity;
using SecureAuth.APPLICATION.Commands.User;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.DOMAIN.Models;

namespace SecureAuth.APPLICATION.Commands.User
{
    public class DeleteUserCommandHandler : ICommandHandler<DeleteUserCommand, bool>
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IActivityLogService _activityLogService;

        public DeleteUserCommandHandler(
            UserManager<ApplicationUser> userManager,
            IUnitOfWork unitOfWork,
            IActivityLogService activityLogService)
        {
            _userManager = userManager;
            _unitOfWork = unitOfWork;
            _activityLogService = activityLogService;
        }

        public async Task<bool> HandleAsync(DeleteUserCommand command)
        {
            var user = await _userManager.FindByIdAsync(command.UserId);
            if (user == null)
                return false;

            IdentityResult result;

            if (command.PermanentDelete)
            {
                result = await _userManager.DeleteAsync(user);
                if (result.Succeeded)
                {
                    await _activityLogService.LogUserActionAsync(
                        user.Id,
                        "UserPermanentlyDeleted",
                        "User",
                        user.Id,
                        "User permanently deleted");
                }
            }
            else
            {
                // Soft delete - mark as inactive
                user.IsActive = false;
                result = await _userManager.UpdateAsync(user);
                
                if (result.Succeeded)
                {
                    await _activityLogService.LogUserActionAsync(
                        user.Id,
                        "UserSoftDeleted",
                        "User",
                        user.Id,
                        "User soft deleted (marked as inactive)");
                }
            }

            if (result.Succeeded)
            {
                await _unitOfWork.SaveChangesAsync();
                return true;
            }

            return false;
        }
    }
} 
