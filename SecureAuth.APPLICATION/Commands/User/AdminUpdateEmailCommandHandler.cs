using Microsoft.AspNetCore.Identity;
using SecureAuth.APPLICATION.Commands.User;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.DOMAIN.Models;

namespace SecureAuth.APPLICATION.Commands.User
{
    public class AdminUpdateEmailCommandHandler : ICommandHandler<AdminUpdateEmailCommand, UpdateEmailResponse>
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IActivityLogService _activityLogService;
        private readonly IEmailService _emailService;

        public AdminUpdateEmailCommandHandler(
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

        public async Task<UpdateEmailResponse> HandleAsync(AdminUpdateEmailCommand command)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(command.UserId);
                if (user == null)
                {
                    return new UpdateEmailResponse
                    {
                        Success = false,
                        Message = "User not found",
                        EmailConfirmed = false
                    };
                }
                var existingUser = await _userManager.FindByEmailAsync(command.NewEmail);
                if (existingUser != null && existingUser.Id != user.Id)
                {
                    return new UpdateEmailResponse
                    {
                        Success = false,
                        Message = "Email is already in use by another user",
                        EmailConfirmed = false
                    };
                }
                if (user.Email == command.NewEmail)
                {
                    return new UpdateEmailResponse
                    {
                        Success = false,
                        Message = "New email is the same as current email",
                        EmailConfirmed = user.EmailConfirmed
                    };
                }
                var oldEmail = user.Email;
                user.Email = command.NewEmail;
                user.UserName = command.NewEmail; 
                user.EmailConfirmed = true;
                var result = await _userManager.UpdateAsync(user);
                if (!result.Succeeded)
                {
                    return new UpdateEmailResponse
                    {
                        Success = false,
                        Message = string.Join(", ", result.Errors.Select(e => e.Description)),
                        EmailConfirmed = false
                    };
                }
                try
                {
                    await _emailService.SendUpdatedCredentialsAsync(
                        command.NewEmail,
                        user.UserName,
                        user.FirstName,
                        user.LastName,
                        "Email");
                }
                catch (Exception ex)
                {
                    // Log the error but don't fail the update
                    // The admin can manually send notification later
                }
                await _activityLogService.LogUserActionAsync(
                    user.Id,
                    "EmailUpdatedByAdmin",
                    "User",
                    user.Id,
                    $"Email updated from {oldEmail} to {command.NewEmail} by admin");

                await _unitOfWork.SaveChangesAsync();

                return new UpdateEmailResponse
                {
                    Success = true,
                    Message = "Email updated successfully and notification sent to user.",
                    EmailConfirmed = true
                };
            }
            catch (Exception ex)
            {
                return new UpdateEmailResponse
                {
                    Success = false,
                    Message = "An error occurred while updating email",
                    EmailConfirmed = false
                };
            }
        }
    }
} 