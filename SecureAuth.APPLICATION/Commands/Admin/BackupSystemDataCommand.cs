using SecureAuth.APPLICATION.DTOs.Admin;

namespace SecureAuth.APPLICATION.Commands.Admin
{
    public class BackupSystemDataCommand : ICommand<BackupResultModel>
    {
        public string BackupType { get; set; } = "Full"; // "Full", "Incremental", "UserData", "Configuration"
        public string StorageLocation { get; set; } = string.Empty;
        public bool IncludeAuditLogs { get; set; } = true;
        public bool EncryptBackup { get; set; } = true;
    }
} 
