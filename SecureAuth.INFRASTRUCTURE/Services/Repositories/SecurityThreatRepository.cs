using Microsoft.EntityFrameworkCore;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.APPLICATION.DTOs.Security;
using SecureAuth.DOMAIN.Models.Security;
using SecureAuth.INFRASTRUCTURE.Data;

namespace SecureAuth.INFRASTRUCTURE.Services.Repositories
{
    public class SecurityThreatRepository : Repository<SecurityThreat>, ISecurityThreatRepository
    {
        public SecurityThreatRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<SecurityThreat>> GetActiveThreatsAsync()
        {
            return await _context.Set<SecurityThreat>()
                .Where(x => x.Status == "Active")
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<SecurityThreat>> GetThreatsByTypeAsync(string threatType)
        {
            return await _context.Set<SecurityThreat>()
                .Where(x => x.ThreatType == threatType)
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<SecurityThreatModel>> GetThreatsAsync(DateTime? startDate, DateTime? endDate, string? threatType, string? severity, bool activeOnly, int page, int pageSize)
        {
            var query = _context.Set<SecurityThreat>().AsQueryable();

            if (startDate.HasValue)
                query = query.Where(x => x.CreatedAt >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(x => x.CreatedAt <= endDate.Value);

            if (!string.IsNullOrEmpty(threatType))
                query = query.Where(x => x.ThreatType == threatType);

            if (!string.IsNullOrEmpty(severity))
                query = query.Where(x => x.Severity == severity);

            if (activeOnly)
                query = query.Where(x => x.IsActive);

            var threats = await query
                .OrderByDescending(x => x.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return threats.Select(t => new SecurityThreatModel
            {
                Id = t.Id,
                ThreatType = t.ThreatType,
                ThreatLevel = t.Severity,
                Description = t.Description ?? string.Empty,
                DetectedAt = t.CreatedAt,
                ResolvedAt = t.ResolvedAt,
                Status = t.Status,
                IpAddress = t.SourceIp,
                UserAgent = t.UserAgent
            }).ToList();
        }
    }
} 