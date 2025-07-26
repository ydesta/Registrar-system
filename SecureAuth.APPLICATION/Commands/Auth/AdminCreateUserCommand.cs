using SecureAuth.APPLICATION.DTOs.Authentication;

namespace SecureAuth.APPLICATION.Commands.Auth
{
    public class AdminCreateUserCommand : ICommand<AdminCreateUserResponse>
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public List<string> RoleNames { get; set; } = new List<string>();
        public bool RequireEmailConfirmation { get; set; } = false;
        public bool RequirePhoneConfirmation { get; set; } = false;
        public bool SendCredentialsEmail { get; set; } = true;
        public string CreatedByUserId { get; set; } = string.Empty; // ID of the Super Admin creating the user
    }
} 