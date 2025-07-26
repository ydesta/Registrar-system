using Microsoft.AspNetCore.Identity;
using SecureAuth.APPLICATION.DTOs.Authentication;
using SecureAuth.DOMAIN.Models;
using Microsoft.Extensions.Logging;
using SecureAuth.APPLICATION.Interfaces;

namespace SecureAuth.APPLICATION.Commands.Auth
{
    public class VerifyEmailCommandHandler : ICommandHandler<VerifyEmailCommand, VerifyEmailResponse>
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<VerifyEmailCommandHandler> _logger;

        public VerifyEmailCommandHandler(
            UserManager<ApplicationUser> userManager,
            IUnitOfWork unitOfWork,
            ILogger<VerifyEmailCommandHandler> logger)
        {
            _userManager = userManager;
            _unitOfWork = unitOfWork;
            _logger = logger;
        }

        public async Task<VerifyEmailResponse> HandleAsync(VerifyEmailCommand command)
        {
            try
            {
                _logger.LogInformation("Starting email verification for email: {Email}", command.Email);
                
                if (string.IsNullOrEmpty(command.Email) || string.IsNullOrEmpty(command.Token))
                {
                    _logger.LogWarning("Invalid email or token provided");
                    return new VerifyEmailResponse { Success = false, Message = "Invalid email or token provided.", EmailVerified = false };
                }

                var user = await _userManager.FindByEmailAsync(command.Email);
                if (user == null)
                {
                    _logger.LogWarning("User not found for email: {Email}", command.Email);
                    return new VerifyEmailResponse { Success = false, Message = "Invalid email address.", EmailVerified = false };
                }

                _logger.LogInformation("User found. Current EmailConfirmed status: {EmailConfirmed}", user.EmailConfirmed);

                // Check if email is already confirmed
                if (user.EmailConfirmed)
                {
                    _logger.LogInformation("Email already confirmed for user: {Email}", command.Email);
                    return new VerifyEmailResponse { Success = true, Message = "Email is already verified.", EmailVerified = true };
                }

                // Verify the token
                _logger.LogInformation("Verifying token for user: {Email}", command.Email);
                var tokenValidationResult = await _userManager.ConfirmEmailAsync(user, command.Token);
                if (!tokenValidationResult.Succeeded)
                {
                    var errors = string.Join(", ", tokenValidationResult.Errors.Select(e => e.Description));
                    _logger.LogError("Token verification failed for user {Email}. Errors: {Errors}", command.Email, errors);
                    return new VerifyEmailResponse { Success = false, Message = errors, EmailVerified = false };
                }

                _logger.LogInformation("Token verified successfully. EmailConfirmed after ConfirmEmailAsync: {EmailConfirmed}", user.EmailConfirmed);

                // Refresh the user entity to get the updated EmailConfirmed status
                await _userManager.UpdateAsync(user);
                
                // Save changes to ensure the EmailConfirmed field is updated in the database
                await _unitOfWork.SaveChangesAsync();
                _logger.LogInformation("Unit of work changes saved");

                // Verify that the email was actually confirmed by re-fetching the user
                var updatedUser = await _userManager.FindByEmailAsync(command.Email);
                _logger.LogInformation("Re-fetched user. Final EmailConfirmed status: {EmailConfirmed}", updatedUser?.EmailConfirmed);
                
                var isEmailVerified = updatedUser?.EmailConfirmed ?? false;
                
                if (!isEmailVerified)
                {
                    _logger.LogWarning("EmailConfirmed still false after verification, attempting manual update");
                    
                    // Manual update as fallback
                    updatedUser.EmailConfirmed = true;
                    var manualUpdateResult = await _userManager.UpdateAsync(updatedUser);
                    
                    if (manualUpdateResult.Succeeded)
                    {
                        await _unitOfWork.SaveChangesAsync();
                        isEmailVerified = true;
                        _logger.LogInformation("Manual update successful. EmailConfirmed set to true");
                    }
                    else
                    {
                        var updateErrors = string.Join(", ", manualUpdateResult.Errors.Select(e => e.Description));
                        _logger.LogError("Manual update failed. Errors: {Errors}", updateErrors);
                    }
                }
                
                return new VerifyEmailResponse { 
                    Success = true, 
                    Message = isEmailVerified ? "Email verified successfully." : "Email verification completed but status update may be delayed.", 
                    EmailVerified = isEmailVerified 
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during email verification for email: {Email}", command.Email);
                return new VerifyEmailResponse { 
                    Success = false, 
                    Message = "An unexpected error occurred during email verification. Please try again.", 
                    EmailVerified = false 
                };
            }
        }
    }
} 
