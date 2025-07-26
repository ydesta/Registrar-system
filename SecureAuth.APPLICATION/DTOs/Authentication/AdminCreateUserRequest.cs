using System.ComponentModel.DataAnnotations;

namespace SecureAuth.APPLICATION.DTOs.Authentication
{
    public class AdminCreateUserRequest
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

        [StringLength(20)]
        public string? PhoneNumber { get; set; }

        // Roles to assign to the user
        public List<string>? RoleNames { get; set; } = new List<string>();

        public bool RequireEmailConfirmation { get; set; } = false; // Usually false for admin-created accounts

        public bool RequirePhoneConfirmation { get; set; } = false;

        public bool SendCredentialsEmail { get; set; } = true; // Send username and generated password
    }
} 