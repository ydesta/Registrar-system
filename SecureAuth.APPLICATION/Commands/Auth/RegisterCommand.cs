using SecureAuth.APPLICATION.DTOs.Authentication;

namespace SecureAuth.APPLICATION.Commands.Auth
{
    public class RegisterCommand : ICommand<RegisterResponse>
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string? Password { get; set; }
        public string? ConfirmPassword { get; set; }
        public bool IsSelfRegistration { get; set; } = true;
        public List<string> RoleNames { get; set; } = new List<string>();
        public bool RequireEmailConfirmation { get; set; } = true;
        public bool RequirePhoneConfirmation { get; set; } = false;
    }
} 
