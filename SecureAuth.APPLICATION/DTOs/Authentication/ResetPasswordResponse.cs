namespace SecureAuth.APPLICATION.DTOs.Authentication
{
    public class ResetPasswordResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public bool PasswordChanged { get; set; } = false;
    }
} 
