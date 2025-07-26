namespace SecureAuth.APPLICATION.DTOs.Authentication
{
    public class ResendOtpResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public DateTime? ExpiresAt { get; set; }
    }
} 