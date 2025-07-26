namespace SecureAuth.APPLICATION.DTOs.Authentication
{
    public class AuthResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? AccessToken { get; set; }
        public string? RefreshToken { get; set; }
        public DateTime ExpiresAt { get; set; }
        public UserInfo? User { get; set; }
        public UserPermissions? Permissions { get; set; }
        public UserSettings? Settings { get; set; }
    }

    public class UserInfo
    {
        public string Id { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public bool EmailConfirmed { get; set; }
        public bool PhoneNumberConfirmed { get; set; }
        public bool TwoFactorEnabled { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? LastLoginAt { get; set; }
        public List<string> Roles { get; set; } = new List<string>();
    }

    public class UserPermissions
    {
        public List<string> Permissions { get; set; } = new List<string>();
        public Dictionary<string, List<string>> RolePermissions { get; set; } = new Dictionary<string, List<string>>();
        public bool IsSuperAdmin { get; set; }
        public bool HasAdminAccess { get; set; }
    }

    public class UserSettings
    {
        public bool RequirePasswordChange { get; set; }
        public bool RequireEmailVerification { get; set; }
        public bool RequirePhoneVerification { get; set; }
        public int SessionTimeoutMinutes { get; set; } = 15;
        public bool EnableAuditLogging { get; set; } = true;
        public List<string> AllowedFeatures { get; set; } = new List<string>();
    }
} 
