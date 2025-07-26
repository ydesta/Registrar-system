namespace SecureAuth.APPLICATION.DTOs.Authentication
{
    public class AdminCreateUserResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? UserId { get; set; }
        public string? Username { get; set; }
        public string? GeneratedPassword { get; set; }
        public List<string>? AssignedRoles { get; set; }
        public bool CredentialsSent { get; set; }
        public bool VerificationSent { get; set; }
    }
} 