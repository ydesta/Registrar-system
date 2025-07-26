using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using SecureAuth.APPLICATION.DTOs.Admin;
using SecureAuth.DOMAIN.Models;

namespace SecureAuth.APPLICATION.Interfaces
{
    public interface IAuditLogRepository : IRepository<AuditLog>
    {
        Task<List<AuditLogModel>> GetUserActivitiesAsync(DateTime start, DateTime end);
        Task<List<AuditLogModel>> GetSecurityEventsAsync(DateTime start, DateTime end);
        Task<List<AuditLogModel>> GetSystemEventsAsync(DateTime start, DateTime end);
    }
} 
