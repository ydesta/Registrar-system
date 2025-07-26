using System.Collections.Generic;

namespace SecureAuth.APPLICATION.DTOs.Security
{
    public class PasswordPolicyModel
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public int MinLength { get; set; } = 8;
        public int MaxLength { get; set; } = 128;
        public bool RequireUppercase { get; set; } = true;
        public bool RequireLowercase { get; set; } = true;
        public bool RequireDigit { get; set; } = true;
        public bool RequireSpecialChar { get; set; } = true;
        public int MaxAgeDays { get; set; } = 90;
        public int HistoryCount { get; set; } = 5;
        public int LockoutThreshold { get; set; } = 5;
        public int LockoutDurationMinutes { get; set; } = 15;
        public List<string>? PolicyHistory { get; set; }
    }
} 
