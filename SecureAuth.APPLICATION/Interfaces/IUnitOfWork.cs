namespace SecureAuth.APPLICATION.Interfaces
{
    public interface IUnitOfWork : IDisposable
    {
        // Repository properties
        IUserRepository Users { get; }
        IRoleRepository Roles { get; }
        IPermissionRepository Permissions { get; }
        IPasswordHistoryRepository PasswordHistory { get; }
        IPasswordResetTokenRepository PasswordResetTokens { get; }
        IRolePermissionRepository RolePermissions { get; }
        IUserCredentialRepository UserCredentials { get; }

        // CQRS and security feature repositories/services
        IPasswordPolicyRepository PasswordPolicy { get; }
        ISystemConfigurationRepository SystemConfiguration { get; }
        ISystemBackupRepository SystemBackup { get; }
        IAuditLogRepository AuditLogs { get; }
        ISecurityEventRepository SecurityEvents { get; }
        ISecurityThreatRepository SecurityThreats { get; }
        IServiceHealthRepository ServiceHealth { get; }
        IDatabaseHealthRepository DatabaseHealth { get; }
        ISystemMetricsRepository SystemMetrics { get; }
        ISecuritySettingsRepository SecuritySettings { get; }

        // Transaction management
        Task<int> SaveChangesAsync();
        Task BeginTransactionAsync();
        Task CommitTransactionAsync();
        Task RollbackTransactionAsync();
        
        // Health check
        Task<bool> CanConnectAsync();
    }
} 
