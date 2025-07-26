using System;
using System.ComponentModel.DataAnnotations;

namespace SecureAuth.DOMAIN.Models.Security
{
    public class PasswordPolicy
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        
        public int MinLength { get; set; }
        public bool RequireUppercase { get; set; }
        public bool RequireLowercase { get; set; }
        public bool RequireDigit { get; set; }
        public bool RequireSpecialCharacter { get; set; }
        public int MaxFailedAttempts { get; set; }
        public int LockoutDuration { get; set; }
        public int PasswordHistorySize { get; set; } = 5;
        public int MaxAgeDays { get; set; } = 90;
        public bool PreventCommonPasswords { get; set; } = true;
        
        // Additional properties for DbContext configuration
        public int HistoryCount { get; set; } = 5;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
} 