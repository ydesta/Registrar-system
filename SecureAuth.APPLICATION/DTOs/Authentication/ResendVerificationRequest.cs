using System.ComponentModel.DataAnnotations;

namespace SecureAuth.APPLICATION.DTOs.Authentication
{
    public class ResendVerificationRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
    }
} 