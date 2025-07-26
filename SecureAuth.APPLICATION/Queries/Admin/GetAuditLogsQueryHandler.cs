using Microsoft.EntityFrameworkCore;
using SecureAuth.APPLICATION.DTOs.Admin;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.DOMAIN.Models;

namespace SecureAuth.APPLICATION.Queries.Admin
{
    public class GetAuditLogsQueryHandler : IQueryHandler<GetAuditLogsQuery, List<AuditLogModel>>
    {
        private readonly IAuditLogRepository _auditLogRepository;

        public GetAuditLogsQueryHandler(IAuditLogRepository auditLogRepository)
        {
            _auditLogRepository = auditLogRepository;
        }

        public async Task<List<AuditLogModel>> HandleAsync(GetAuditLogsQuery query)
        {
            // Get all audit logs from the repository
            var allLogs = await _auditLogRepository.GetAllAsync();
            var auditLogs = allLogs.Cast<AuditLog>().ToList();

            // Apply filters
            var filteredLogs = auditLogs.AsQueryable();

            if (query.StartDate.HasValue)
            {
                filteredLogs = filteredLogs.Where(log => log.Timestamp >= query.StartDate.Value);
            }

            if (query.EndDate.HasValue)
            {
                filteredLogs = filteredLogs.Where(log => log.Timestamp <= query.EndDate.Value);
            }

            if (!string.IsNullOrEmpty(query.UserId))
            {
                filteredLogs = filteredLogs.Where(log => log.UserId == query.UserId);
            }

            if (!string.IsNullOrEmpty(query.ActionType))
            {
                filteredLogs = filteredLogs.Where(log => log.Action == query.ActionType);
            }

            if (!string.IsNullOrEmpty(query.EntityType))
            {
                filteredLogs = filteredLogs.Where(log => log.EntityType == query.EntityType);
            }

            // Apply sorting
            filteredLogs = query.SortBy?.ToLower() switch
            {
                "timestamp" => query.SortDescending 
                    ? filteredLogs.OrderByDescending(log => log.Timestamp)
                    : filteredLogs.OrderBy(log => log.Timestamp),
                "action" => query.SortDescending 
                    ? filteredLogs.OrderByDescending(log => log.Action)
                    : filteredLogs.OrderBy(log => log.Action),
                "entitytype" => query.SortDescending 
                    ? filteredLogs.OrderByDescending(log => log.EntityType)
                    : filteredLogs.OrderBy(log => log.EntityType),
                _ => query.SortDescending 
                    ? filteredLogs.OrderByDescending(log => log.Timestamp)
                    : filteredLogs.OrderBy(log => log.Timestamp)
            };

            // Apply pagination
            var pagedLogs = filteredLogs
                .Skip((query.Page - 1) * query.PageSize)
                .Take(query.PageSize)
                .ToList();

            // Map to DTOs
            return pagedLogs.Select(log => new AuditLogModel
            {
                Id = log.Id,
                UserId = log.UserId,
                ActionType = log.Action,
                EntityType = log.EntityType,
                EntityId = log.EntityId,
                Description = log.Details ?? string.Empty,
                IpAddress = log.IpAddress,
                UserAgent = log.UserAgent,
                Timestamp = log.Timestamp
            }).ToList();
        }
    }
} 