using SecureAuth.APPLICATION.DTOs.Admin;

namespace SecureAuth.APPLICATION.Commands.Admin
{
    public class RestoreSystemDataCommand : ICommand<RestoreResultModel>
    {
        public string BackupFilePath { get; set; } = string.Empty;
        public string RestoreType { get; set; } = "Full"; // "Full", "Partial", "UserData", "Configuration"
        public bool ValidateBackup { get; set; } = true;
        public bool CreateRestorePoint { get; set; } = true;
    }
} 
