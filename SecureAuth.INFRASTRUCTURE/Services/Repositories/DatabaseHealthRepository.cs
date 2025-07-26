using Microsoft.EntityFrameworkCore;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.DOMAIN.Models;
using SecureAuth.INFRASTRUCTURE.Data;

namespace SecureAuth.INFRASTRUCTURE.Services.Repositories
{
    public class DatabaseHealthRepository : Repository<DatabaseHealth>, IDatabaseHealthRepository
    {
        public DatabaseHealthRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<DatabaseHealth?> GetLatestHealthAsync()
        {
            return await _context.Set<DatabaseHealth>()
                .OrderByDescending(x => x.Timestamp)
                .FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<DatabaseHealth>> GetHealthHistoryAsync(int count)
        {
            return await _context.Set<DatabaseHealth>()
                .OrderByDescending(x => x.Timestamp)
                .Take(count)
                .ToListAsync();
        }

        public async Task<bool> CheckConnectionAsync()
        {
            return await _context.Database.CanConnectAsync();
        }

        public async Task<int> GetResponseTimeAsync()
        {
            return 100; // Simplified implementation - return 100ms
        }

        public async Task<int> GetActiveConnectionsAsync()
        {
            return 1; // Simplified implementation
        }
    }
} 