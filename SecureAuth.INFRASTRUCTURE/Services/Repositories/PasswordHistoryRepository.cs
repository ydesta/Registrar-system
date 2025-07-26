using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.INFRASTRUCTURE.Data;
using SecureAuth.DOMAIN.Models.Security;
using SecureAuth.APPLICATION.DTOs.Security;

namespace SecureAuth.INFRASTRUCTURE.Services.Repositories
{
    public class PasswordHistoryRepository : Repository<PasswordHistory>, IPasswordHistoryRepository
    {
        public PasswordHistoryRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<bool> IsPasswordInHistoryAsync(string userId, string password)
        {
            var passwordHistory = await _dbSet
                .Where(ph => ph.UserId == userId)
                .OrderByDescending(ph => ph.CreatedAt)
                .Take(5) // Password history size
                .ToListAsync();

            return passwordHistory.Any(ph => ph.PasswordHash == password);
        }

        public async Task AddPasswordToHistoryAsync(string userId, string password, string changedBy, string reason)
        {
            var passwordHistory = new PasswordHistory
            {
                UserId = userId,
                PasswordHash = password,
                CreatedAt = DateTime.UtcNow,
                ChangedBy = changedBy,
                ChangeReason = reason
            };

            await _dbSet.AddAsync(passwordHistory);
        }

        public async Task<List<PasswordHistoryEntry>> GetPasswordHistoryAsync(string userId)
        {
            return await _dbSet
                .Where(ph => ph.UserId == userId)
                .OrderByDescending(ph => ph.CreatedAt)
                .Take(5) // Password history size
                .Select(ph => new PasswordHistoryEntry
                {
                    PasswordHash = ph.PasswordHash,
                    CreatedAt = ph.CreatedAt,
                    ChangedBy = ph.ChangedBy,
                    ChangeReason = ph.ChangeReason
                })
                .ToListAsync();
        }

        public async Task<int> GetPasswordHistoryCountAsync(string userId)
        {
            return await _dbSet.CountAsync(ph => ph.UserId == userId);
        }

        public async Task ClearPasswordHistoryAsync(string userId)
        {
            var historyToDelete = await _dbSet
                .Where(ph => ph.UserId == userId)
                .ToListAsync();

            _dbSet.RemoveRange(historyToDelete);
        }

        public async Task<IEnumerable<PasswordHistory>> GetRecentPasswordChangesAsync(int days)
        {
            var cutoffDate = DateTime.UtcNow.AddDays(-days);
            return await _dbSet
                .Where(ph => ph.CreatedAt >= cutoffDate)
                .OrderByDescending(ph => ph.CreatedAt)
                .ToListAsync();
        }
    }
} 