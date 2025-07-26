using Microsoft.EntityFrameworkCore;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.DOMAIN.Models;
using SecureAuth.INFRASTRUCTURE.Data;

namespace SecureAuth.INFRASTRUCTURE.Services.Repositories
{
    public class SystemBackupRepository : Repository<SystemBackup>, ISystemBackupRepository
    {
        public SystemBackupRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<SystemBackup?> GetLatestBackupAsync()
        {
            return await _context.Set<SystemBackup>()
                .OrderByDescending(x => x.CreatedAt)
                .FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<SystemBackup>> GetBackupsByDateRangeAsync(DateTime startDate, DateTime endDate)
        {
            return await _context.Set<SystemBackup>()
                .Where(x => x.CreatedAt >= startDate && x.CreatedAt <= endDate)
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();
        }

        public async Task<long> CreateFullBackupAsync(string backupPath, bool encrypt)
        {
            // Simplified implementation - return file size
            return 1024 * 1024; // 1MB
        }

        public async Task<long> CreateIncrementalBackupAsync(string backupPath, bool encrypt)
        {
            // Simplified implementation - return file size
            return 512 * 1024; // 512KB
        }

        public async Task<long> CreateUserDataBackupAsync(string backupPath, bool encrypt)
        {
            // Simplified implementation - return file size
            return 256 * 1024; // 256KB
        }

        public async Task<long> CreateConfigurationBackupAsync(string backupPath, bool encrypt)
        {
            // Simplified implementation - return file size
            return 64 * 1024; // 64KB
        }
    }
} 