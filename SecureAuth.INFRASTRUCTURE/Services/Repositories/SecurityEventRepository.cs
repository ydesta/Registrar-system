using Microsoft.EntityFrameworkCore;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.APPLICATION.DTOs.Security;
using SecureAuth.DOMAIN.Models.Security;
using SecureAuth.INFRASTRUCTURE.Data;

namespace SecureAuth.INFRASTRUCTURE.Services.Repositories
{
    public class SecurityEventRepository : Repository<SecurityEvent>, ISecurityEventRepository
    {
        public SecurityEventRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<SecurityEvent>> GetEventsByUserIdAsync(string userId)
        {
            return await _context.Set<SecurityEvent>()
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.Timestamp)
                .ToListAsync();
        }

        public async Task<IEnumerable<SecurityEvent>> GetEventsBySeverityAsync(string severity)
        {
            return await _context.Set<SecurityEvent>()
                .Where(x => x.Severity == severity)
                .OrderByDescending(x => x.Timestamp)
                .ToListAsync();
        }

        public async Task<List<SecurityEventModel>> GetUserSecurityEventsAsync(string userId, DateTime startDate, DateTime endDate)
        {
            var events = await _context.Set<SecurityEvent>()
                .Where(x => x.UserId == userId && x.Timestamp >= startDate && x.Timestamp <= endDate)
                .OrderByDescending(x => x.Timestamp)
                .ToListAsync();

            return events.Select(e => new SecurityEventModel
            {
                Id = e.Id,
                EventType = e.EventType,
                UserId = e.UserId,
                Timestamp = e.Timestamp,
                IpAddress = e.IpAddress,
                UserAgent = e.UserAgent,
                Description = e.Description,
                Severity = e.Severity
            }).ToList();
        }
    }
} 