namespace SecureAuth.APPLICATION.DTOs.Admin
{
    public class BackupResultModel
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string BackupId { get; set; } = string.Empty;
        public string BackupType { get; set; } = string.Empty;
        public DateTime StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public TimeSpan? Duration { get; set; }
        public long BackupSize { get; set; }
        public string StorageLocation { get; set; } = string.Empty;
    }
} 
