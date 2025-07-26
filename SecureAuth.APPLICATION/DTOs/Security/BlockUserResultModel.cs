namespace SecureAuth.APPLICATION.DTOs.Security
{
    public class BlockUserResultModel
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public DateTime? BlockedUntil { get; set; }
        public string Reason { get; set; } = string.Empty;
        public bool NotificationSent { get; set; } = false;
    }
} 
