using SecureAuth.APPLICATION.Commands.Security;
using SecureAuth.APPLICATION.DTOs.Security;
using SecureAuth.APPLICATION.Interfaces;
using Microsoft.AspNetCore.Identity;
using SecureAuth.DOMAIN.Models;

namespace SecureAuth.APPLICATION.Commands.Security
{
    public class BlockUserCommandHandler : ICommandHandler<BlockUserCommand, BlockUserResultModel>
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IActivityLogService _activityLogService;
        private readonly IEmailService _emailService;

        public BlockUserCommandHandler(
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

        public async Task<BlockUserResultModel> HandleAsync(BlockUserCommand command)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(command.UserId);
                if (user == null)
                {
                    return new BlockUserResultModel 
                    { 
                        Success = false, 
                        Message = "User not found" 
                    };
                }

                // Check if user is already blocked
                if (user.LockoutEnd.HasValue && user.LockoutEnd.Value > DateTime.UtcNow)
                {
                    return new BlockUserResultModel 
                    { 
                        Success = false, 
                        Message = "User is already blocked" 
                    };
                }

                // Prevent blocking admin users
                var userRoles = await _userManager.GetRolesAsync(user);
                var adminRoles = new[] { "Super Admin", "Admin" };
                var isAdmin = userRoles.Any(r => adminRoles.Contains(r));
                if (isAdmin)
                {
                    return new BlockUserResultModel 
                    { 
                        Success = false, 
                        Message = "Cannot block admin users" 
                    };
                }

                // Calculate lockout end time
                var lockoutEnd = command.BlockUntil ?? DateTime.UtcNow.AddYears(100); // Permanent block

                // Block the user
                var result = await _userManager.SetLockoutEndDateAsync(user, lockoutEnd);
                if (!result.Succeeded)
                {
                    return new BlockUserResultModel 
                    { 
                        Success = false, 
                        Message = "Failed to block user" 
                    };
                }

                // Update user status
                user.IsActive = false;
                await _userManager.UpdateAsync(user);

                // Log the action
                await _activityLogService.LogUserActionAsync(
                    "System",
                    "BlockUser",
                    "User",
                    user.Id,
                    $"User blocked: {command.Reason}. Block until: {lockoutEnd:yyyy-MM-dd HH:mm:ss}");

                // Send notification to user if requested
                if (command.NotifyUser)
                {
                    await _emailService.SendAccountBlockedNotificationAsync(
                        user.Email,
                        command.Reason,
                        lockoutEnd);
                }

                await _unitOfWork.SaveChangesAsync();

                return new BlockUserResultModel
                {
                    Success = true,
                    Message = $"User blocked successfully until {lockoutEnd:yyyy-MM-dd HH:mm:ss}",
                    UserId = user.Id,
                    BlockedUntil = lockoutEnd,
                    Reason = command.Reason
                };
            }
            catch (Exception ex)
            {
                return new BlockUserResultModel 
                { 
                    Success = false, 
                    Message = $"Error blocking user: {ex.Message}" 
                };
            }
        }
    }
} 
