using Microsoft.AspNetCore.Identity;
using SecureAuth.APPLICATION.DTOs.Authentication;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.APPLICATION.Services;
using SecureAuth.DOMAIN.Models;
using Microsoft.Extensions.Logging;

namespace SecureAuth.APPLICATION.Commands.Auth
{
    public class RegisterCommandHandler : ICommandHandler<RegisterCommand, RegisterResponse>
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<ApplicationRole> _roleManager;
        private readonly IEmailService _emailService;
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<RegisterCommandHandler> _logger;

        public RegisterCommandHandler(
            UserManager<ApplicationUser> userManager,
            RoleManager<ApplicationRole> roleManager,
            IEmailService emailService,
            IUnitOfWork unitOfWork,
            ILogger<RegisterCommandHandler> logger)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _emailService = emailService;
            _unitOfWork = unitOfWork;
            _logger = logger;
        }

        public async Task<RegisterResponse> HandleAsync(RegisterCommand command)
        {
            try
            {
                _logger.LogInformation("Starting registration process for email: {Email}, IsSelfRegistration: {IsSelfRegistration}", 
                    command.Email, command.IsSelfRegistration);

                if (command.IsSelfRegistration)
                {
                    if (string.IsNullOrEmpty(command.Password))
                    {
                        _logger.LogWarning("Registration failed: Password is required for self-registration. Email: {Email}", command.Email);
                        return new RegisterResponse { Success = false, Message = "Password is required for self-registration." };
                    }

                    if (string.IsNullOrEmpty(command.ConfirmPassword))
                    {
                        _logger.LogWarning("Registration failed: Password confirmation is required for self-registration. Email: {Email}", command.Email);
                        return new RegisterResponse { Success = false, Message = "Password confirmation is required for self-registration." };
                    }

                    if (command.Password != command.ConfirmPassword)
                    {
                        _logger.LogWarning("Registration failed: Password and confirmation password do not match. Email: {Email}", command.Email);
                        return new RegisterResponse { Success = false, Message = "Password and confirmation password do not match." };
                    }
                }

                var existingUser = await _userManager.FindByEmailAsync(command.Email);
                if (existingUser != null)
                {
                    _logger.LogWarning("Registration failed: Email already registered. Email: {Email}", command.Email);
                    return new RegisterResponse { Success = false, Message = "Email already registered." };
                }

                var user = new ApplicationUser
                {
                    UserName = command.Email,
                    Email = command.Email,
                    FirstName = command.FirstName,
                    LastName = command.LastName,
                    PhoneNumber = command.PhoneNumber,
                    EmailConfirmed = !command.RequireEmailConfirmation,
                    PhoneNumberConfirmed = !command.RequirePhoneConfirmation
                };

                IdentityResult result;
                string generatedPassword = string.Empty;
                if (command.IsSelfRegistration)
                {
                    _logger.LogInformation("Creating user with self-registration. Email: {Email}", command.Email);
                    result = await _userManager.CreateAsync(user, command.Password);
                }
                else
                {
                    var passwordGenerator = new PasswordGeneratorService();
                    generatedPassword = passwordGenerator.GenerateReadablePassword(10);
                    _logger.LogInformation("Creating user with admin registration. Email: {Email}, Generated password length: {PasswordLength}", 
                        command.Email, generatedPassword.Length);
                    result = await _userManager.CreateAsync(user, generatedPassword);
                }

                if (!result.Succeeded)
                {
                    var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                    _logger.LogError("User creation failed for email: {Email}. Errors: {Errors}", command.Email, errors);
                    return new RegisterResponse { Success = false, Message = errors };
                }

                _logger.LogInformation("User created successfully. UserId: {UserId}, Email: {Email}", user.Id, user.Email);

                if (command.IsSelfRegistration)
                {
                    if (await _roleManager.RoleExistsAsync("Applicant"))
                    {
                        var roleResult = await _userManager.AddToRoleAsync(user, "Applicant");
                        if (!roleResult.Succeeded)
                        {
                            var roleErrors = string.Join(", ", roleResult.Errors.Select(e => e.Description));
                            _logger.LogError("Role assignment failed for user: {UserId}. Errors: {Errors}", user.Id, roleErrors);
                            await _userManager.DeleteAsync(user);
                            return new RegisterResponse { Success = false, Message = $"User created but role assignment failed: {roleErrors}" };
                        }
                        _logger.LogInformation("Assigned 'Applicant' role to user: {UserId}", user.Id);
                    }
                }
                else
                {
                    if (command.RoleNames != null && command.RoleNames.Any())
                    {
                        foreach (var roleName in command.RoleNames)
                        {
                            if (!await _roleManager.RoleExistsAsync(roleName))
                            {
                                _logger.LogError("Role '{RoleName}' does not exist for user: {UserId}", roleName, user.Id);
                                await _userManager.DeleteAsync(user);
                                return new RegisterResponse { Success = false, Message = $"Role '{roleName}' does not exist." };
                            }
                        }

                        var roleResult = await _userManager.AddToRolesAsync(user, command.RoleNames);
                        if (!roleResult.Succeeded)
                        {
                            var roleErrors = string.Join(", ", roleResult.Errors.Select(e => e.Description));
                            _logger.LogError("Role assignment failed for user: {UserId}. Errors: {Errors}", user.Id, roleErrors);
                            await _userManager.DeleteAsync(user);
                            return new RegisterResponse { Success = false, Message = $"User created but role assignment failed: {roleErrors}" };
                        }
                        _logger.LogInformation("Assigned roles {Roles} to user: {UserId}", string.Join(", ", command.RoleNames), user.Id);
                    }
                }

                bool credentialsSent = false;
                bool verificationSent = false;

                // Send credentials email for admin-created accounts
                if (!command.IsSelfRegistration && !string.IsNullOrEmpty(generatedPassword))
                {
                    try
                    {
                        _logger.LogInformation("Sending credentials email to user: {UserId}, Email: {Email}", user.Id, user.Email);
                        await _emailService.SendUserCredentialsAsync(
                            user.Email, 
                            user.UserName, 
                            generatedPassword, 
                            user.FirstName, 
                            user.LastName);
                        credentialsSent = true;
                        _logger.LogInformation("Credentials email sent successfully to user: {UserId}", user.Id);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to send credentials email to user: {UserId}, Email: {Email}. Error: {ErrorMessage}", 
                            user.Id, user.Email, ex.Message);
                        // Don't fail the user creation, just log the error
                    }
                }

                // Send email verification if required (non-blocking)
                if (command.RequireEmailConfirmation)
                {
                    try
                    {
                        _logger.LogInformation("Sending email verification to user: {UserId}, Email: {Email}", user.Id, user.Email);
                        var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
                        
                        // Fire and forget email sending to avoid blocking registration
                        _ = Task.Run(async () =>
                        {
                            try
                            {
                                await _emailService.SendEmailConfirmationAsync(user.Email, token);
                                _logger.LogInformation("Email verification sent successfully to user: {UserId}", user.Id);
                            }
                            catch (Exception ex)
                            {
                                _logger.LogError(ex, "Failed to send email verification to user: {UserId}, Email: {Email}. Error: {ErrorMessage}", 
                                    user.Id, user.Email, ex.Message);
                            }
                        });
                        
                        verificationSent = true;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to generate email verification token for user: {UserId}, Email: {Email}. Error: {ErrorMessage}", 
                            user.Id, user.Email, ex.Message);
                        // Don't fail the user creation, just log the error
                    }
                }

                await _unitOfWork.SaveChangesAsync();
                _logger.LogInformation("Registration completed successfully for user: {UserId}, Email: {Email}", user.Id, user.Email);

                string successMessage;
                if (command.IsSelfRegistration)
                {
                    successMessage = "Registration successful. You have been assigned the 'Applicant' role. Please check your email to confirm your account.";
                }
                else
                {
                    var assignedRoles = command.RoleNames != null && command.RoleNames.Any() 
                        ? string.Join(", ", command.RoleNames) 
                        : "No roles assigned";
                    
                    successMessage = $"Registration successful. Assigned roles: {assignedRoles}. ";
                    
                    if (credentialsSent && verificationSent)
                    {
                        successMessage += "Credentials and verification email sent to user.";
                    }
                    else if (credentialsSent)
                    {
                        successMessage += "Credentials sent to user.";
                    }
                    else if (verificationSent)
                    {
                        successMessage += "Verification email sent to user.";
                    }
                    else
                    {
                        successMessage += "Please check your email to confirm your account.";
                    }
                }

                return new RegisterResponse { Success = true, Message = successMessage };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during registration for email: {Email}. Error: {ErrorMessage}", 
                    command.Email, ex.Message);
                return new RegisterResponse { Success = false, Message = "An unexpected error occurred during registration. Please try again." };
            }
        }
    }
} 
