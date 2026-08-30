using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using SecureAuth.APPLICATION.DTOs.Authentication;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.DOMAIN.Models;

namespace SecureAuth.APPLICATION.Commands.User
{
    public class AdminResendEmailVerificationCommandHandler
        : ICommandHandler<AdminResendEmailVerificationCommand, ResendVerificationResponse>
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IEmailService _emailService;
        private readonly ILogger<AdminResendEmailVerificationCommandHandler> _logger;

        public AdminResendEmailVerificationCommandHandler(
            UserManager<ApplicationUser> userManager,
            IEmailService emailService,
            ILogger<AdminResendEmailVerificationCommandHandler> logger)
        {
            _userManager = userManager;
            _emailService = emailService;
            _logger = logger;
        }

        public async Task<ResendVerificationResponse> HandleAsync(AdminResendEmailVerificationCommand command)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(command.UserId))
                {
                    return new ResendVerificationResponse
                    {
                        Success = false,
                        Message = "User ID is required."
                    };
                }

                var user = await _userManager.FindByIdAsync(command.UserId);
                if (user == null)
                {
                    return new ResendVerificationResponse
                    {
                        Success = false,
                        Message = "User not found."
                    };
                }

                if (string.IsNullOrWhiteSpace(user.Email))
                {
                    return new ResendVerificationResponse
                    {
                        Success = false,
                        Message = "User does not have an email address."
                    };
                }

                if (user.EmailConfirmed)
                {
                    return new ResendVerificationResponse
                    {
                        Success = false,
                        Message = "Email is already confirmed."
                    };
                }

                var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
                await _emailService.SendEmailConfirmationAsync(user.Email, token);

                _logger.LogInformation("Admin resent email verification for user {UserId} ({Email})", user.Id, user.Email);
                return new ResendVerificationResponse
                {
                    Success = true,
                    Message = $"Verification email has been sent to {user.Email}."
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resending email verification for user {UserId}", command.UserId);
                return new ResendVerificationResponse
                {
                    Success = false,
                    Message = "Failed to resend verification email."
                };
            }
        }
    }
}
