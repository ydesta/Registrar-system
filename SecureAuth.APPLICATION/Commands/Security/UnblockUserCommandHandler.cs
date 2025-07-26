using SecureAuth.APPLICATION.Commands.Security;
using SecureAuth.APPLICATION.DTOs.Security;
using SecureAuth.APPLICATION.Interfaces;
using Microsoft.AspNetCore.Identity;
using SecureAuth.DOMAIN.Models;

namespace SecureAuth.APPLICATION.Commands.Security
{
    public class UnblockUserCommandHandler : ICommandHandler<UnblockUserCommand, UnblockUserResultModel>
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IActivityLogService _activityLogService;
        private readonly IEmailService _emailService;

        public UnblockUserCommandHandler(
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

        public async Task<UnblockUserResultModel> HandleAsync(UnblockUserCommand command)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(command.UserId);
                if (user == null)
                {
                    return new UnblockUserResultModel 
                    { 
                        Success = false, 
                        Message = "User not found" 
                    };
                }

                // Check if user is actually blocked
                if (!user.LockoutEnd.HasValue || user.LockoutEnd.Value <= DateTime.UtcNow)
                {
                    return new UnblockUserResultModel 
                    { 
                        Success = false, 
                        Message = "User is not currently blocked" 
                    };
                }

                // Unblock the user
                var result = await _userManager.SetLockoutEndDateAsync(user, null);
                if (!result.Succeeded)
                {
                    return new UnblockUserResultModel 
                    { 
                        Success = false, 
                        Message = "Failed to unblock user" 
                    };
                }

                // Reset failed login attempts
                await _userManager.ResetAccessFailedCountAsync(user);

                // Update user status
                user.IsActive = true;
                await _userManager.UpdateAsync(user);

                // Log the action
                await _activityLogService.LogUserActionAsync(
                    "System",
                    "UnblockUser",
                    "User",
                    user.Id,
                    $"User unblocked: {command.Reason}");

                // Send notification to user if requested
                if (command.NotifyUser)
                {
                    await _emailService.SendAccountUnblockedNotificationAsync(
                        user.Email,
                        command.Reason);
                }

                await _unitOfWork.SaveChangesAsync();

                return new UnblockUserResultModel
                {
                    Success = true,
                    Message = "User unblocked successfully",
                    UserId = user.Id,
                    UnblockedAt = DateTime.UtcNow,
                    Reason = command.Reason
                };
            }
            catch (Exception ex)
            {
                return new UnblockUserResultModel 
                { 
                    Success = false, 
                    Message = $"Error unblocking user: {ex.Message}" 
                };
            }
        }
    }
} 
