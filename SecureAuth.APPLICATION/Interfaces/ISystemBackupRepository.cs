namespace SecureAuth.APPLICATION.Interfaces
{
    public interface ISystemBackupRepository
    {
        Task<long> CreateFullBackupAsync(string location, bool encrypt);
        Task<long> CreateIncrementalBackupAsync(string location, bool encrypt);
        Task<long> CreateUserDataBackupAsync(string location, bool encrypt);
        Task<long> CreateConfigurationBackupAsync(string location, bool encrypt);
    }
} 
