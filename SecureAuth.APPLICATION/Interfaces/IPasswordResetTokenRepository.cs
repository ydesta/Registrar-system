using System;
using System.Threading.Tasks;
using SecureAuth.DOMAIN.Models.Security;

namespace SecureAuth.APPLICATION.Interfaces
{
    public interface IPasswordResetTokenRepository : IRepository<PasswordResetToken>
    {
        // Domain-specific password reset token operations
        Task StoreResetTokenAsync(string userId, string token, DateTime expiresAt);
        Task<bool> IsValidResetTokenAsync(string userId, string token);
        Task InvalidateResetTokenAsync(string userId, string token);
        Task<PasswordResetToken> GetByTokenAsync(string token);
        Task<IEnumerable<PasswordResetToken>> GetExpiredTokensAsync();
        Task CleanupExpiredTokensAsync();
        Task<int> GetActiveTokenCountAsync(string userId);
    }
} 
