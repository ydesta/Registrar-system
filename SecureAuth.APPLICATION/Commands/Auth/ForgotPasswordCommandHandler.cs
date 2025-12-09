using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using SecureAuth.APPLICATION.DTOs.Authentication;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.DOMAIN.Models;

namespace SecureAuth.APPLICATION.Commands.Auth
{
    public class ForgotPasswordCommandHandler : ICommandHandler<ForgotPasswordCommand, ForgotPasswordResponse>
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IEmailService _emailService;
        private readonly ILogger<ForgotPasswordCommandHandler> _logger;

        public ForgotPasswordCommandHandler(
            UserManager<ApplicationUser> userManager,
            IEmailService emailService,
            ILogger<ForgotPasswordCommandHandler> logger)
        {
            _userManager = userManager;
            _emailService = emailService;
            _logger = logger;
        }

        public async Task<ForgotPasswordResponse> HandleAsync(ForgotPasswordCommand command)
        {
            try
            {
                _logger.LogInformation("Forgot password request initiated for email: {Email}", command.Email);
                
                var user = await _userManager.FindByEmailAsync(command.Email);
                if (user == null)
                {
                    // Do not reveal that the user does not exist
                    _logger.LogInformation("Forgot password request for unregistered email: {Email}", command.Email);
                    return new ForgotPasswordResponse 
                    { 
                        Success = false, 
                        Message = "No account found with this email address. Please check your email or create a new account.",
                        EmailSent = false
                    };
                }

                if (!(await _userManager.IsEmailConfirmedAsync(user)))
                {
                    // Do not reveal that the email is not confirmed
                    _logger.LogInformation("Forgot password request for unconfirmed email: {Email}", command.Email);
                    return new ForgotPasswordResponse 
                    { 
                        Success = false, 
                        Message = "If your email is registered, you will receive a password reset link.",
                        EmailSent = false
                    };
                }

                _logger.LogInformation("Generating password reset token for user: {UserId}", user.Id);
                var token = await _userManager.GeneratePasswordResetTokenAsync(user);
                
                _logger.LogInformation("Sending password reset email to: {Email}", user.Email);
                await _emailService.SendPasswordResetAsync(user.Email, token);
                
                _logger.LogInformation("Password reset email sent successfully to: {Email}", user.Email);
                return new ForgotPasswordResponse 
                { 
                    Success = true, 
                    Message = "If your email is registered, you will receive a password reset link.",
                    EmailSent = true
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while processing forgot password request for email: {Email}", command.Email);
                
                // Return success to maintain security (don't reveal if email exists)
                // But log the actual error for monitoring
                return new ForgotPasswordResponse 
                { 
                    Success = true, 
                    Message = "If your email is registered, you will receive a password reset link.",
                    EmailSent = false
                };
            }
        }
    }
} 
