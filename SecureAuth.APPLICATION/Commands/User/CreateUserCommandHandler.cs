using Microsoft.AspNetCore.Identity;
using SecureAuth.APPLICATION.Commands.User;
using SecureAuth.APPLICATION.DTOs.User;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.DOMAIN.Models;

namespace SecureAuth.APPLICATION.Commands.User
{
    public class CreateUserCommandHandler : ICommandHandler<CreateUserCommand, CreateUserCommandResponse>
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IActivityLogService _activityLogService;

        public CreateUserCommandHandler(
            UserManager<ApplicationUser> userManager,
            IUnitOfWork unitOfWork,
            IActivityLogService activityLogService)
        {
            _userManager = userManager;
            _unitOfWork = unitOfWork;
            _activityLogService = activityLogService;
        }

        public async Task<CreateUserCommandResponse> HandleAsync(CreateUserCommand command)
        {
            // Check if email already exists
            if (await _unitOfWork.Users.IsEmailUniqueAsync(command.Email) == false)
            {
                return new CreateUserCommandResponse
                {
                    Success = false,
                    Message = "Email already exists",
                    UserId = null
                };
            }

            // Create user
            var user = new ApplicationUser
            {
                UserName = command.Email,
                Email = command.Email,
                FirstName = command.FirstName,
                LastName = command.LastName,
                PhoneNumber = command.PhoneNumber,
                IsActive = command.IsActive,
                EmailConfirmed = !command.RequireEmailConfirmation,
                CreatedAt = DateTime.UtcNow
            };

            var result = await _userManager.CreateAsync(user, command.Password);

            if (!result.Succeeded)
            {
                return new CreateUserCommandResponse
                {
                    Success = false,
                    Message = string.Join(", ", result.Errors.Select(e => e.Description)),
                    UserId = null
                };
            }

            // Assign role if specified
            if (!string.IsNullOrEmpty(command.RoleName))
            {
                var roleResult = await _userManager.AddToRoleAsync(user, command.RoleName);
                if (!roleResult.Succeeded)
                {
                    // Log role assignment failure but don't fail the user creation
                    await _activityLogService.LogUserActionAsync(
                        user.Id, 
                        "RoleAssignmentFailed", 
                        "User", 
                        user.Id, 
                        $"Failed to assign role {command.RoleName}: {string.Join(", ", roleResult.Errors.Select(e => e.Description))}");
                }
            }

            // Log the user creation
            await _activityLogService.LogUserActionAsync(
                user.Id, 
                "UserCreated", 
                "User", 
                user.Id, 
                $"User created: {user.FirstName} {user.LastName} ({user.Email})");

            await _unitOfWork.SaveChangesAsync();

            return new CreateUserCommandResponse
            {
                Success = true,
                Message = "User created successfully",
                UserId = user.Id
            };
        }
    }
} 
