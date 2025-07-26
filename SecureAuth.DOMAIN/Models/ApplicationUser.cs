using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;
using SecureAuth.DOMAIN.Interfaces;

namespace SecureAuth.DOMAIN.Models
{
    public class ApplicationUser : IdentityUser, IUserIdentity
    {
        [Required]
        [StringLength(50)]
        public string FirstName { get; set; } = string.Empty;

        [StringLength(50)]
        public string? MiddleName { get; set; }

        [Required]
        [StringLength(50)]
        public string LastName { get; set; } = string.Empty;

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? LastLoginAt { get; set; }

        [Required]
        public bool IsActive { get; set; } = true;

        [Required]
        public int FailedLoginAttempts { get; set; }

        public new DateTimeOffset? LockoutEnd { get; set; }

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? PasswordChangedAt { get; set; }

        // Additional properties for security status
        public DateTime? LastLoginDate { get; set; }

        public DateTime? PasswordChangedDate { get; set; }

        public string? RefreshToken { get; set; }

        public DateTime? RefreshTokenExpiry { get; set; }
    }
} 