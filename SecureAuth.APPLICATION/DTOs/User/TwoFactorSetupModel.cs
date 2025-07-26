namespace SecureAuth.APPLICATION.DTOs.User
{
    public class TwoFactorSetupModel
    {
        public bool Success { get; set; }
        public string? UserId { get; set; }
        public string? Email { get; set; }
        public bool IsTwoFactorEnabled { get; set; }
        public List<string> AvailableProviders { get; set; } = new List<string>();
        public string? Message { get; set; }
        public string? SecretKey { get; set; }
        public string? QrCodeUri { get; set; }
        public string? ManualEntryKey { get; set; }
    }
} 
