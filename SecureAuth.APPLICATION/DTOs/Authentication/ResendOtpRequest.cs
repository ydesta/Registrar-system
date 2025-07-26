using System.ComponentModel.DataAnnotations;

namespace SecureAuth.APPLICATION.DTOs.Authentication
{
    public class ResendOtpRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
    }
} 