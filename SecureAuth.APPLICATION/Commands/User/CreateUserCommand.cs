using SecureAuth.APPLICATION.DTOs.User;

namespace SecureAuth.APPLICATION.Commands.User
{
    public class CreateUserCommand : ICommand<CreateUserCommandResponse>
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string? RoleName { get; set; }
        public bool IsActive { get; set; } = true;
        public bool RequireEmailConfirmation { get; set; } = true;
    }
} 
