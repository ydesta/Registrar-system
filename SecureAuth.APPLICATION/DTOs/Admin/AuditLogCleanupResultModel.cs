namespace SecureAuth.APPLICATION.DTOs.Admin
{
    public class AuditLogCleanupResultModel
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public int RecordsDeleted { get; set; }
        public int RecordsArchived { get; set; }
        public DateTime CleanupDate { get; set; }
        public string LogType { get; set; } = string.Empty;
        public bool Archived { get; set; }
        public string? ArchiveLocation { get; set; }
    }
} 
