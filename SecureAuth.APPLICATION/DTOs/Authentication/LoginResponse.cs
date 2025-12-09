namespace SecureAuth.APPLICATION.DTOs.Authentication
{
    public class LoginResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? Token { get; set; }
        public string? RefreshToken { get; set; }
        public bool RequiresTwoFactor { get; set; } = false;
        public UserInfo? User { get; set; }
        public UserPermissions? Permissions { get; set; }
        public bool IsLocked { get; set; } = false;
        public DateTime? LockoutEnd { get; set; }
        public int RemainingAttempts { get; set; } = -1;
    }
} 