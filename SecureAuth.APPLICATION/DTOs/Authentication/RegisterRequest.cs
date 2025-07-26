using System.ComponentModel.DataAnnotations;

namespace SecureAuth.APPLICATION.DTOs.Authentication
{
    public class RegisterRequest
    {
        [Required]
        [StringLength(50)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string LastName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        // Password is only required for self-registration
        [StringLength(100, MinimumLength = 8)]
        public string? Password { get; set; }

        // Confirm password is only required for self-registration
        public string? ConfirmPassword { get; set; }

        [StringLength(20)]
        public string? PhoneNumber { get; set; }

        // Indicates if this is a self-registration (online/guest registration)
        public bool IsSelfRegistration { get; set; } = true;

        // Roles to assign when IsSelfRegistration is false
        public List<string>? RoleNames { get; set; } = new List<string>();

        public bool RequireEmailConfirmation { get; set; } = true;

        public bool RequirePhoneConfirmation { get; set; } = false;
    }
} 
