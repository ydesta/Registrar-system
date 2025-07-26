namespace SecureAuth.APPLICATION.DTOs.Admin
{
    public class RestoreResultModel
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string RestoreId { get; set; } = string.Empty;
        public string RestoreType { get; set; } = string.Empty;
        public DateTime StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public TimeSpan? Duration { get; set; }
        public bool BackupValidated { get; set; }
        public bool RestorePointCreated { get; set; }
    }
} 
