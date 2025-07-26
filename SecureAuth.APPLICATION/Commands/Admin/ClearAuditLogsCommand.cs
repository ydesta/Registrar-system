using SecureAuth.APPLICATION.DTOs.Admin;

namespace SecureAuth.APPLICATION.Commands.Admin
{
    public class ClearAuditLogsCommand : ICommand<AuditLogCleanupResultModel>
    {
        public DateTime OlderThan { get; set; }
        public string LogType { get; set; } = "All"; // "All", "UserActivity", "SecurityEvents", "SystemEvents"
        public bool ArchiveBeforeDelete { get; set; } = true;
        public string ArchiveLocation { get; set; } = string.Empty;
    }
} 
