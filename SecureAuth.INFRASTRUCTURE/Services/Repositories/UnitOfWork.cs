using Microsoft.EntityFrameworkCore.Storage;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.INFRASTRUCTURE.Data;

namespace SecureAuth.INFRASTRUCTURE.Services.Repositories
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly ApplicationDbContext _context;
        private IDbContextTransaction _transaction;

        // Repository properties
        public IUserRepository Users { get; }
        public IRoleRepository Roles { get; }
        public IPermissionRepository Permissions { get; }
        public IPasswordHistoryRepository PasswordHistory { get; }
        public IPasswordResetTokenRepository PasswordResetTokens { get; }
        public IRolePermissionRepository RolePermissions { get; }
        public IUserCredentialRepository UserCredentials { get; }
        public IPasswordPolicyRepository PasswordPolicy { get; }
        public ISystemConfigurationRepository SystemConfiguration { get; }
        public ISystemBackupRepository SystemBackup { get; }
        public IAuditLogRepository AuditLogs { get; }
        public ISecurityEventRepository SecurityEvents { get; }
        public ISecurityThreatRepository SecurityThreats { get; }
        public IServiceHealthRepository ServiceHealth { get; }
        public IDatabaseHealthRepository DatabaseHealth { get; }
        public ISystemMetricsRepository SystemMetrics { get; }
        public ISecuritySettingsRepository SecuritySettings { get; }

        public UnitOfWork(
            ApplicationDbContext context,
            IUserRepository userRepository,
            IRoleRepository roleRepository,
            IPermissionRepository permissionRepository,
            IPasswordHistoryRepository passwordHistoryRepository,
            IPasswordResetTokenRepository passwordResetTokenRepository,
            IRolePermissionRepository rolePermissionRepository,
            IUserCredentialRepository userCredentialRepository,
            IPasswordPolicyRepository passwordPolicyRepository,
            ISystemConfigurationRepository systemConfigurationRepository,
            ISystemBackupRepository systemBackupRepository,
            IAuditLogRepository auditLogRepository,
            ISecurityEventRepository securityEventRepository,
            ISecurityThreatRepository securityThreatRepository,
            IServiceHealthRepository serviceHealthRepository,
            IDatabaseHealthRepository databaseHealthRepository,
            ISystemMetricsRepository systemMetricsRepository,
            ISecuritySettingsRepository securitySettingsRepository
            )
        {
            _context = context;
            Users = userRepository;
            Roles = roleRepository;
            Permissions = permissionRepository;
            PasswordHistory = passwordHistoryRepository;
            PasswordResetTokens = passwordResetTokenRepository;
            RolePermissions = rolePermissionRepository;
            UserCredentials = userCredentialRepository;
            PasswordPolicy = passwordPolicyRepository;
            SystemConfiguration = systemConfigurationRepository;
            SystemBackup = systemBackupRepository;
            AuditLogs = auditLogRepository;
            SecurityEvents = securityEventRepository;
            SecurityThreats = securityThreatRepository;
            ServiceHealth = serviceHealthRepository;
            DatabaseHealth = databaseHealthRepository;
            SystemMetrics = systemMetricsRepository;
            SecuritySettings = securitySettingsRepository;
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }

        public async Task BeginTransactionAsync()
        {
            _transaction = await _context.Database.BeginTransactionAsync();
        }

        public async Task CommitTransactionAsync()
        {
            if (_transaction != null)
            {
                await _transaction.CommitAsync();
                await _transaction.DisposeAsync();
                _transaction = null;
            }
        }

        public async Task RollbackTransactionAsync()
        {
            if (_transaction != null)
            {
                await _transaction.RollbackAsync();
                await _transaction.DisposeAsync();
                _transaction = null;
            }
        }

        public async Task<bool> CanConnectAsync()
        {
            try
            {
                return await _context.Database.CanConnectAsync();
            }
            catch
            {
                return false;
            }
        }

        public void Dispose()
        {
            _transaction?.Dispose();
            _context?.Dispose();
        }
    }
} 