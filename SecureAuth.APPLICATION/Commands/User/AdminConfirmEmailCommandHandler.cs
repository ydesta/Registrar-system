using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using SecureAuth.DOMAIN.Models;

namespace SecureAuth.APPLICATION.Commands.User
{
    public class AdminConfirmEmailCommandHandler : ICommandHandler<AdminConfirmEmailCommand, AdminConfirmEmailResult>
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<AdminConfirmEmailCommandHandler> _logger;

        public AdminConfirmEmailCommandHandler(
            UserManager<ApplicationUser> userManager,
            ILogger<AdminConfirmEmailCommandHandler> logger)
        {
            _userManager = userManager;
            _logger = logger;
        }

        public async Task<AdminConfirmEmailResult> HandleAsync(AdminConfirmEmailCommand command)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(command.UserId))
                {
                    return new AdminConfirmEmailResult
                    {
                        Success = false,
                        Message = "User ID is required.",
                        EmailConfirmed = false
                    };
                }

                var user = await _userManager.FindByIdAsync(command.UserId);
                if (user == null)
                {
                    return new AdminConfirmEmailResult
                    {
                        Success = false,
                        Message = "User not found.",
                        EmailConfirmed = false
                    };
                }

                if (user.EmailConfirmed)
                {
                    return new AdminConfirmEmailResult
                    {
                        Success = true,
                        Message = "Email is already confirmed.",
                        EmailConfirmed = true
                    };
                }

                user.EmailConfirmed = true;
                var result = await _userManager.UpdateAsync(user);
                if (!result.Succeeded)
                {
                    var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                    _logger.LogWarning("Failed to confirm email for user {UserId}: {Errors}", command.UserId, errors);
                    return new AdminConfirmEmailResult
                    {
                        Success = false,
                        Message = errors,
                        EmailConfirmed = false
                    };
                }

                _logger.LogInformation("Admin confirmed email for user {UserId} ({Email})", user.Id, user.Email);
                return new AdminConfirmEmailResult
                {
                    Success = true,
                    Message = "Email confirmed successfully.",
                    EmailConfirmed = true
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error confirming email for user {UserId}", command.UserId);
                return new AdminConfirmEmailResult
                {
                    Success = false,
                    Message = "An error occurred while confirming the email.",
                    EmailConfirmed = false
                };
            }
        }
    }
}
