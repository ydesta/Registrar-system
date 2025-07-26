using SecureAuth.APPLICATION.DTOs.Authentication;

namespace SecureAuth.APPLICATION.Commands.Auth
{
    public class AdminRegisterCommand : ICommand<RegisterResponse>
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string ConfirmPassword { get; set; } = string.Empty;
        public List<string> RoleNames { get; set; } = new List<string>();
        public bool RequireEmailConfirmation { get; set; } = true;
        public bool RequirePhoneConfirmation { get; set; } = false;
        public string CreatedByUserId { get; set; } = string.Empty; // ID of the Super Admin creating the user
    }
} 