using Microsoft.AspNetCore.Identity;
using SecureAuth.APPLICATION.DTOs.Authentication;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.APPLICATION.Services;
using SecureAuth.DOMAIN.Models;

namespace SecureAuth.APPLICATION.Commands.Auth
{
    public class AdminCreateUserCommandHandler : ICommandHandler<AdminCreateUserCommand, AdminCreateUserResponse>
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<ApplicationRole> _roleManager;
        private readonly IEmailService _emailService;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IPasswordGeneratorService _passwordGenerator;

        public AdminCreateUserCommandHandler(
            UserManager<ApplicationUser> userManager,
            RoleManager<ApplicationRole> roleManager,
            IEmailService emailService,
            IUnitOfWork unitOfWork,
            IPasswordGeneratorService passwordGenerator)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _emailService = emailService;
            _unitOfWork = unitOfWork;
            _passwordGenerator = passwordGenerator;
        }

        public async Task<AdminCreateUserResponse> HandleAsync(AdminCreateUserCommand command)
        {
            // Check if the user creating this account is a Super Admin
            var creator = await _userManager.FindByIdAsync(command.CreatedByUserId);
            if (creator == null)
            {
                return new AdminCreateUserResponse { Success = false, Message = "Creator user not found." };
            }

            var creatorRoles = await _userManager.GetRolesAsync(creator);
            if (!creatorRoles.Contains("Super Admin"))
            {
                return new AdminCreateUserResponse { Success = false, Message = "Only Super Admin can create user accounts." };
            }

            // Check if user already exists
            var existingUser = await _userManager.FindByEmailAsync(command.Email);
            if (existingUser != null)
            {
                return new AdminCreateUserResponse { Success = false, Message = "Email already registered." };
            }

            // Validate that all specified roles exist
            if (command.RoleNames != null && command.RoleNames.Any())
            {
                foreach (var roleName in command.RoleNames)
                {
                    if (!await _roleManager.RoleExistsAsync(roleName))
                    {
                        return new AdminCreateUserResponse { Success = false, Message = $"Role '{roleName}' does not exist." };
                    }
                }
            }

            // Generate a temporary password
            var generatedPassword = _passwordGenerator.GenerateReadablePassword(10);

            // Create the user
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

            var result = await _userManager.CreateAsync(user, generatedPassword);
            if (!result.Succeeded)
            {
                return new AdminCreateUserResponse { Success = false, Message = string.Join(", ", result.Errors.Select(e => e.Description)) };
            }

            // Assign roles to the user
            if (command.RoleNames != null && command.RoleNames.Any())
            {
                var roleResult = await _userManager.AddToRolesAsync(user, command.RoleNames);
                if (!roleResult.Succeeded)
                {
                    // If role assignment fails, delete the user and return error
                    await _userManager.DeleteAsync(user);
                    return new AdminCreateUserResponse { Success = false, Message = $"User created but role assignment failed: {string.Join(", ", roleResult.Errors.Select(e => e.Description))}" };
                }
            }

            // Send credentials email if requested
            bool credentialsSent = false;
            bool verificationSent = false;
            
            if (command.SendCredentialsEmail)
            {
                try
                {
                    await _emailService.SendUserCredentialsAsync(
                        user.Email, 
                        user.UserName, 
                        generatedPassword, 
                        user.FirstName, 
                        user.LastName);
                    credentialsSent = true;
                }
                catch (Exception ex)
                {
                    // Log the error but don't fail the user creation
                    // The admin can manually send credentials later
                }
            }

            // Send email verification if required
            if (command.RequireEmailConfirmation)
            {
                try
                {
                    var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
                    await _emailService.SendEmailConfirmationAsync(user.Email, token);
                    verificationSent = true;
                }
                catch (Exception ex)
                {
                    // Log the error but don't fail the user creation
                    // The admin can manually send verification later
                }
            }

            await _unitOfWork.SaveChangesAsync();

            var assignedRoles = command.RoleNames != null ? string.Join(", ", command.RoleNames) : "No roles assigned";
            var message = $"User created successfully with roles: {assignedRoles}. ";
            
            if (credentialsSent && verificationSent)
            {
                message += "Credentials and verification email sent to user.";
            }
            else if (credentialsSent)
            {
                message += "Credentials sent to user.";
            }
            else if (verificationSent)
            {
                message += "Verification email sent to user.";
            }
            else
            {
                message += "No emails sent due to configuration or email errors.";
            }

            return new AdminCreateUserResponse
            {
                Success = true,
                Message = message,
                UserId = user.Id,
                Username = user.UserName,
                GeneratedPassword = generatedPassword,
                AssignedRoles = command.RoleNames?.ToList(),
                CredentialsSent = credentialsSent,
                VerificationSent = verificationSent
            };
        }
    }
} 