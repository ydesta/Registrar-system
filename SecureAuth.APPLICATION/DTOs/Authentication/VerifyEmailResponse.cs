namespace SecureAuth.APPLICATION.DTOs.Authentication
{
    public class VerifyEmailResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public bool EmailVerified { get; set; } = false;
    }
} 
