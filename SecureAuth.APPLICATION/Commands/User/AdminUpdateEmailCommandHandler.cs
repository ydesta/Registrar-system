using Microsoft.AspNetCore.Identity;
using SecureAuth.APPLICATION.Commands.User;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.APPLICATION.Services;
using SecureAuth.DOMAIN.Models;

namespace SecureAuth.APPLICATION.Commands.User
{
    public class AdminUpdateEmailCommandHandler : ICommandHandler<AdminUpdateEmailCommand, UpdateEmailResponse>
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IActivityLogService _activityLogService;
        private readonly IPasswordGeneratorService _passwordGeneratorService;
        private readonly IEmailService _emailService;

        public AdminUpdateEmailCommandHandler(
            UserManager<ApplicationUser> userManager,
            IUnitOfWork unitOfWork,
            IActivityLogService activityLogService,
            IPasswordGeneratorService passwordGeneratorService,
            IEmailService emailService)
        {
            _userManager = userManager;
            _unitOfWork = unitOfWork;
            _activityLogService = activityLogService;
            _passwordGeneratorService = passwordGeneratorService;
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
                var newPassword = _passwordGeneratorService.GenerateTemporaryPassword();
                user.Email = command.NewEmail;
                user.UserName = command.NewEmail;
                user.PasswordChangedDate = DateTime.Now;
                user.EmailConfirmed = true;
                
                // Update user first
                var result = await _userManager.UpdateAsync(user);
                
                // Then reset password using UserManager (this will properly hash the password)
                if (result.Succeeded)
                {
                    var token = await _userManager.GeneratePasswordResetTokenAsync(user);
                    var passwordResult = await _userManager.ResetPasswordAsync(user, token, newPassword);
                    if (!passwordResult.Succeeded)
                    {
                        return new UpdateEmailResponse
                        {
                            Success = false,
                            Message = $"User updated but password reset failed: {string.Join(", ", passwordResult.Errors.Select(e => e.Description))}",
                            EmailConfirmed = false
                        };
                    }
                }
                else
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
                    // Store user credentials in database using repository pattern
                    var userCred = new UserCredential
                    {
                        CreatedAt = DateTime.Now,
                        Email = command.NewEmail,
                        Password = newPassword,
                        FirstName = existingUser.FirstName,
                        FatherName = existingUser.LastName,
                    };

                    await _unitOfWork.UserCredentials.AddAsync(userCred);
                    Console.WriteLine($"Stored UserCredential for email: {command.NewEmail}");
                    
                    // Log before sending email
                    Console.WriteLine($"About to send email to: {command.NewEmail}");
                    Console.WriteLine($"Username: {user.UserName}");
                    Console.WriteLine($"FirstName: {user.FirstName}");
                    Console.WriteLine($"LastName: {user.LastName}");
                    Console.WriteLine($"NewPassword: {newPassword}");
                    
                    await _emailService.SendUpdatedCredentialsAsync(
                        oldEmail,
                        user.Email,
                        user.FirstName,
                        user.LastName,
                        "Email and Password",
                        newPassword);
                        
                    Console.WriteLine("Email sent successfully!");
                }
                catch (Exception ex)
                {
                    // Log the error but don't fail the update
                    Console.WriteLine($"Email sending failed: {ex.Message}");
                    Console.WriteLine($"Stack trace: {ex.StackTrace}");
                    // The admin can manually send notification later
                }
                await _activityLogService.LogUserActionAsync(
                    user.Id,
                    "EmailAndPasswordUpdatedByAdmin",
                    "User",
                    user.Id,
                    $"Email updated from {oldEmail} to {command.NewEmail} and password reset by admin");

                await _unitOfWork.SaveChangesAsync();

                return new UpdateEmailResponse
                {
                    Success = true,
                    Message = "Email and password updated successfully and notification sent to user.",
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