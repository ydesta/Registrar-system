using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using SecureAuth.APPLICATION.DTOs.Security;

namespace SecureAuth.APPLICATION.Interfaces
{
    public interface ISecurityEventRepository
    {
        Task<List<SecurityEventModel>> GetUserSecurityEventsAsync(string userId, DateTime start, DateTime end);
    }
} 
