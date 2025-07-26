namespace SecureAuth.APPLICATION.Interfaces
{
    public interface ISystemBackupService
    {
        Task<bool> CreateBackupAsync(string description = "", string backupType = "Manual");
        Task<bool> RestoreBackupAsync(string backupId);
        Task<bool> DeleteBackupAsync(string backupId);
        Task<List<object>> GetAllBackupsAsync();
        Task<object?> GetBackupByIdAsync(string backupId);
        Task<object> GetBackupStatisticsAsync();
        Task<bool> ScheduleAutomaticBackupAsync(int intervalHours = 24);
        Task<bool> CancelScheduledBackupAsync();
        Task<bool> ValidateBackupIntegrityAsync(string backupId);
        Task<bool> ExportBackupAsync(string backupId, string filePath);
        Task<bool> ImportBackupAsync(string filePath);
    }
} 