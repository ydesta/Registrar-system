using System.ComponentModel.DataAnnotations;

namespace SecureAuth.APPLICATION.DTOs.Authentication
{
    public class OtpVerifyRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Otp { get; set; } = string.Empty;
    }
} 
