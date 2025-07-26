using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using SecureAuth.APPLICATION.DTOs.Security;
using SecureAuth.DOMAIN.Models.Security;

namespace SecureAuth.APPLICATION.Interfaces
{
    public interface ISecurityThreatRepository : IRepository<SecurityThreat>
    {
        Task<List<SecurityThreatModel>> GetThreatsAsync(DateTime? startDate, DateTime? endDate, string? threatLevel, string? threatType, bool includeResolved, int page, int pageSize);
        Task<IEnumerable<SecurityThreat>> GetActiveThreatsAsync();
        Task<IEnumerable<SecurityThreat>> GetThreatsByTypeAsync(string threatType);
    }
} 
