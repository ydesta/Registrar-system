namespace SecureAuth.APPLICATION.DTOs.Authentication
{
    public class OtpVerifyResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public bool OtpVerified { get; set; } = false;
        public string? Purpose { get; set; }
        public string? Token { get; set; }
        public string? RefreshToken { get; set; }
        public UserInfo? User { get; set; }
        public UserPermissions? Permissions { get; set; }
    }
} 
