using System.Collections.Generic;
using System.Threading.Tasks;
using SecureAuth.APPLICATION.DTOs.Security;
using SecureAuth.DOMAIN.Models.Security;

namespace SecureAuth.APPLICATION.Interfaces
{
    public interface IPasswordHistoryRepository : IRepository<PasswordHistory>
    {
        // Domain-specific password history operations
        Task<bool> IsPasswordInHistoryAsync(string userId, string password);
        Task AddPasswordToHistoryAsync(string userId, string password, string changedBy, string reason);
        Task<List<PasswordHistoryEntry>> GetPasswordHistoryAsync(string userId);
        Task<int> GetPasswordHistoryCountAsync(string userId);
        Task ClearPasswordHistoryAsync(string userId);
        Task<IEnumerable<PasswordHistory>> GetRecentPasswordChangesAsync(int days);
    }
} 
