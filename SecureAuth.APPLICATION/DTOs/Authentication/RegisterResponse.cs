namespace SecureAuth.APPLICATION.DTOs.Authentication
{
    public class RegisterResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? UserId { get; set; }
        public bool RequiresEmailConfirmation { get; set; } = false;
        public bool RequiresPhoneConfirmation { get; set; } = false;
    }
} 
