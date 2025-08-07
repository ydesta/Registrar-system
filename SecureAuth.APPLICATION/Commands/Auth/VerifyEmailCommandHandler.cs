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

                // Verify the token using Identity's built-in method
                _logger.LogInformation("Verifying token for user: {Email}", command.Email);
                var tokenValidationResult = await _userManager.ConfirmEmailAsync(user, command.Token);
                if (!tokenValidationResult.Succeeded)
                {
                    var errors = string.Join(", ", tokenValidationResult.Errors.Select(e => e.Description));
                    _logger.LogError("Token verification failed for user {Email}. Errors: {Errors}", command.Email, errors);
                    return new VerifyEmailResponse { Success = false, Message = errors, EmailVerified = false };
                }

                _logger.LogInformation("Token verified successfully. EmailConfirmed after ConfirmEmailAsync: {EmailConfirmed}", user.EmailConfirmed);

                // Re-fetch the user to get the updated EmailConfirmed status
                var updatedUser = await _userManager.FindByEmailAsync(command.Email);
                if (updatedUser == null)
                {
                    _logger.LogError("Failed to re-fetch user after email confirmation");
                    return new VerifyEmailResponse { Success = false, Message = "Failed to verify email status.", EmailVerified = false };
                }

                _logger.LogInformation("Re-fetched user. Final EmailConfirmed status: {EmailConfirmed}", updatedUser.EmailConfirmed);
                
                var isEmailVerified = updatedUser.EmailConfirmed;
                
                // If EmailConfirmed is still false after ConfirmEmailAsync, try a direct database update
                if (!isEmailVerified)
                {
                    _logger.LogWarning("EmailConfirmed still false after verification, attempting direct update");
                    
                    try
                    {
                        // Use a transaction to ensure data consistency
                        await _unitOfWork.BeginTransactionAsync();
                        
                        // Directly update the EmailConfirmed field
                        updatedUser.EmailConfirmed = true;
                        var updateResult = await _userManager.UpdateAsync(updatedUser);
                        
                        if (updateResult.Succeeded)
                        {
                            await _unitOfWork.CommitTransactionAsync();
                            isEmailVerified = true;
                            _logger.LogInformation("Direct update successful. EmailConfirmed set to true");
                        }
                        else
                        {
                            await _unitOfWork.RollbackTransactionAsync();
                            var updateErrors = string.Join(", ", updateResult.Errors.Select(e => e.Description));
                            _logger.LogError("Direct update failed. Errors: {Errors}", updateErrors);
                        }
                    }
                    catch (Exception ex)
                    {
                        await _unitOfWork.RollbackTransactionAsync();
                        _logger.LogError(ex, "Exception during direct email confirmation update");
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

