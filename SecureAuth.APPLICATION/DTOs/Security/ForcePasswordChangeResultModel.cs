namespace SecureAuth.APPLICATION.DTOs.Security
{
    public class ForcePasswordChangeResultModel
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
        public bool NotificationSent { get; set; } = false;
        public bool RequireImmediateChange { get; set; } = true;
    }
} 
