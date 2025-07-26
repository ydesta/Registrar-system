using SecureAuth.APPLICATION.Commands.Admin;
using SecureAuth.APPLICATION.DTOs.Admin;
using SecureAuth.APPLICATION.Interfaces;

namespace SecureAuth.APPLICATION.Commands.Admin
{
    public class BackupSystemDataCommandHandler : ICommandHandler<BackupSystemDataCommand, BackupResultModel>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IActivityLogService _activityLogService;

        public BackupSystemDataCommandHandler(
            IUnitOfWork unitOfWork,
            IActivityLogService activityLogService)
        {
            _unitOfWork = unitOfWork;
            _activityLogService = activityLogService;
        }

        public async Task<BackupResultModel> HandleAsync(BackupSystemDataCommand command)
        {
            try
            {
                var backupResult = new BackupResultModel
                {
                    BackupId = Guid.NewGuid().ToString(),
                    BackupType = command.BackupType,
                    StartedAt = DateTime.UtcNow,
                    StorageLocation = command.StorageLocation
                };

                // Validate storage location
                if (string.IsNullOrEmpty(command.StorageLocation))
                {
                    return new BackupResultModel 
                    { 
                        Success = false, 
                        Message = "Storage location is required" 
                    };
                }

                // Perform backup based on type
                switch (command.BackupType.ToLower())
                {
                    case "full":
                        backupResult = await PerformFullBackup(command, backupResult);
                        break;
                    case "incremental":
                        backupResult = await PerformIncrementalBackup(command, backupResult);
                        break;
                    case "userdata":
                        backupResult = await PerformUserDataBackup(command, backupResult);
                        break;
                    case "configuration":
                        backupResult = await PerformConfigurationBackup(command, backupResult);
                        break;
                    default:
                        return new BackupResultModel 
                        { 
                            Success = false, 
                            Message = "Invalid backup type" 
                        };
                }

                if (backupResult.Success)
                {
                    // Log successful backup
                    await _activityLogService.LogUserActionAsync(
                        "System",
                        "BackupSystemData",
                        "SystemBackup",
                        backupResult.BackupId,
                        $"System backup completed: {command.BackupType} backup to {command.StorageLocation}");

                    backupResult.CompletedAt = DateTime.UtcNow;
                    backupResult.Duration = backupResult.CompletedAt.Value - backupResult.StartedAt;
                }

                return backupResult;
            }
            catch (Exception ex)
            {
                return new BackupResultModel 
                { 
                    Success = false, 
                    Message = $"Backup failed: {ex.Message}" 
                };
            }
        }

        private async Task<BackupResultModel> PerformFullBackup(BackupSystemDataCommand command, BackupResultModel result)
        {
            // Implementation for full system backup
            // This would include all data, configuration, and audit logs
            result.BackupSize = await _unitOfWork.SystemBackup.CreateFullBackupAsync(
                command.StorageLocation, 
                command.EncryptBackup);

            result.Success = result.BackupSize > 0;
            result.Message = result.Success ? "Full backup completed successfully" : "Full backup failed";
            
            return result;
        }

        private async Task<BackupResultModel> PerformIncrementalBackup(BackupSystemDataCommand command, BackupResultModel result)
        {
            // Implementation for incremental backup
            // This would include only changes since last backup
            result.BackupSize = await _unitOfWork.SystemBackup.CreateIncrementalBackupAsync(
                command.StorageLocation, 
                command.EncryptBackup);

            result.Success = result.BackupSize > 0;
            result.Message = result.Success ? "Incremental backup completed successfully" : "Incremental backup failed";
            
            return result;
        }

        private async Task<BackupResultModel> PerformUserDataBackup(BackupSystemDataCommand command, BackupResultModel result)
        {
            // Implementation for user data backup only
            result.BackupSize = await _unitOfWork.SystemBackup.CreateUserDataBackupAsync(
                command.StorageLocation, 
                command.EncryptBackup);

            result.Success = result.BackupSize > 0;
            result.Message = result.Success ? "User data backup completed successfully" : "User data backup failed";
            
            return result;
        }

        private async Task<BackupResultModel> PerformConfigurationBackup(BackupSystemDataCommand command, BackupResultModel result)
        {
            // Implementation for configuration backup only
            result.BackupSize = await _unitOfWork.SystemBackup.CreateConfigurationBackupAsync(
                command.StorageLocation, 
                command.EncryptBackup);

            result.Success = result.BackupSize > 0;
            result.Message = result.Success ? "Configuration backup completed successfully" : "Configuration backup failed";
            
            return result;
        }
    }
} 
