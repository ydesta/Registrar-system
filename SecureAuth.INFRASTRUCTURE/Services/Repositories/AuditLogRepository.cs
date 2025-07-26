using Microsoft.EntityFrameworkCore;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.APPLICATION.DTOs.Admin;
using SecureAuth.DOMAIN.Models;
using SecureAuth.INFRASTRUCTURE.Data;

namespace SecureAuth.INFRASTRUCTURE.Services.Repositories
{
    public class AuditLogRepository : Repository<AuditLog>, IAuditLogRepository
    {
        public AuditLogRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<AuditLog>> GetLogsByUserIdAsync(string userId)
        {
            return await _context.Set<AuditLog>()
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.Timestamp)
                .ToListAsync();
        }

        public async Task<IEnumerable<AuditLog>> GetLogsByDateRangeAsync(DateTime startDate, DateTime endDate)
        {
            return await _context.Set<AuditLog>()
                .Where(x => x.Timestamp >= startDate && x.Timestamp <= endDate)
                .OrderByDescending(x => x.Timestamp)
                .ToListAsync();
        }

        public async Task<List<AuditLogModel>> GetUserActivitiesAsync(DateTime startDate, DateTime endDate)
        {
            var logs = await GetLogsByDateRangeAsync(startDate, endDate);
            return logs.Select(log => new AuditLogModel
            {
                Id = log.Id,
                UserId = log.UserId,
                ActionType = log.Action,
                EntityType = log.EntityType,
                EntityId = log.EntityId,
                Description = log.Details ?? string.Empty,
                Timestamp = log.Timestamp,
                IpAddress = log.IpAddress,
                UserAgent = log.UserAgent
            }).ToList();
        }

        public async Task<List<AuditLogModel>> GetSecurityEventsAsync(DateTime startDate, DateTime endDate)
        {
            var logs = await GetLogsByDateRangeAsync(startDate, endDate);
            return logs.Select(log => new AuditLogModel
            {
                Id = log.Id,
                UserId = log.UserId,
                ActionType = log.Action,
                EntityType = log.EntityType,
                EntityId = log.EntityId,
                Description = log.Details ?? string.Empty,
                Timestamp = log.Timestamp,
                IpAddress = log.IpAddress,
                UserAgent = log.UserAgent
            }).ToList();
        }

        public async Task<List<AuditLogModel>> GetSystemEventsAsync(DateTime startDate, DateTime endDate)
        {
            var logs = await GetLogsByDateRangeAsync(startDate, endDate);
            return logs.Select(log => new AuditLogModel
            {
                Id = log.Id,
                UserId = log.UserId,
                ActionType = log.Action,
                EntityType = log.EntityType,
                EntityId = log.EntityId,
                Description = log.Details ?? string.Empty,
                Timestamp = log.Timestamp,
                IpAddress = log.IpAddress,
                UserAgent = log.UserAgent
            }).ToList();
        }
    }
} 