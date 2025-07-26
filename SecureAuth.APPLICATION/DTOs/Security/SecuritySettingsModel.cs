using System.Collections.Generic;

namespace SecureAuth.APPLICATION.DTOs.Security
{
    public class SecuritySettingsModel
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public int SessionTimeoutMinutes { get; set; } = 30;
        public int MaxLoginAttempts { get; set; } = 5;
        public int LockoutDurationMinutes { get; set; } = 15;
        public int PasswordChangeIntervalDays { get; set; } = 90;
        public bool TwoFactorRequired { get; set; } = false;
        public bool IpWhitelistEnabled { get; set; } = false;
        public List<string>? IpWhitelist { get; set; }
        public bool RequireEmailConfirmation { get; set; } = true;
        public bool RequirePhoneConfirmation { get; set; } = false;
        public string ConfigurationSection { get; set; } = "All";
    }
} 
