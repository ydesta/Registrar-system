using Microsoft.EntityFrameworkCore;
using SecureAuth.APPLICATION.DTOs.Admin;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.DOMAIN.Models;

namespace SecureAuth.APPLICATION.Queries.Admin
{
    public class GetAuditLogByIdQueryHandler : IQueryHandler<GetAuditLogByIdQuery, AuditLogModel>
    {
        private readonly IAuditLogRepository _auditLogRepository;

        public GetAuditLogByIdQueryHandler(IAuditLogRepository auditLogRepository)
        {
            _auditLogRepository = auditLogRepository;
        }

        public async Task<AuditLogModel> HandleAsync(GetAuditLogByIdQuery query)
        {
            var auditLog = await _auditLogRepository.GetByIdAsync(query.Id);
            
            if (auditLog == null)
                return null;

            return new AuditLogModel
            {
                Id = auditLog.Id,
                UserId = auditLog.UserId,
                ActionType = auditLog.Action,
                EntityType = auditLog.EntityType,
                EntityId = auditLog.EntityId,
                Description = auditLog.Details ?? string.Empty,
                IpAddress = auditLog.IpAddress,
                UserAgent = auditLog.UserAgent,
                Timestamp = auditLog.Timestamp
            };
        }
    }
} 