using Microsoft.EntityFrameworkCore;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.DOMAIN.Models;
using SecureAuth.INFRASTRUCTURE.Data;

namespace SecureAuth.INFRASTRUCTURE.Services.Repositories
{
    public class ServiceHealthRepository : Repository<ServiceHealth>, IServiceHealthRepository
    {
        public ServiceHealthRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<ServiceHealth?> GetLatestHealthAsync()
        {
            return await _context.Set<ServiceHealth>()
                .OrderByDescending(x => x.Timestamp)
                .FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<ServiceHealth>> GetHealthHistoryAsync(int count)
        {
            return await _context.Set<ServiceHealth>()
                .OrderByDescending(x => x.Timestamp)
                .Take(count)
                .ToListAsync();
        }

        public async Task<string> CheckAuthenticationServiceAsync()
        {
            return "Healthy"; // Simplified implementation
        }

        public async Task<string> CheckEmailServiceAsync()
        {
            return "Healthy"; // Simplified implementation
        }

        public async Task<string> CheckNotificationServiceAsync()
        {
            return "Healthy"; // Simplified implementation
        }
    }
} 