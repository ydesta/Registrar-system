using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.INFRASTRUCTURE.Data;
using SecureAuth.DOMAIN.Models.Security;

namespace SecureAuth.INFRASTRUCTURE.Services.Repositories
{
    public class PasswordResetTokenRepository : Repository<PasswordResetToken>, IPasswordResetTokenRepository
    {
        public PasswordResetTokenRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task StoreResetTokenAsync(string userId, string token, DateTime expiresAt)
        {
            var resetToken = new PasswordResetToken
            {
                UserId = userId,
                Token = token,
                ExpiresAt = expiresAt,
                CreatedAt = DateTime.UtcNow
            };

            await _dbSet.AddAsync(resetToken);
        }

        public async Task<bool> IsValidResetTokenAsync(string userId, string token)
        {
            var resetToken = await _dbSet
                .Where(prt => prt.UserId == userId && prt.Token == token && prt.ExpiresAt > DateTime.UtcNow)
                .FirstOrDefaultAsync();

            return resetToken != null;
        }

        public async Task InvalidateResetTokenAsync(string userId, string token)
        {
            var resetToken = await _dbSet
                .Where(prt => prt.UserId == userId && prt.Token == token)
                .FirstOrDefaultAsync();

            if (resetToken != null)
            {
                _dbSet.Remove(resetToken);
            }
        }

        public async Task<PasswordResetToken> GetByTokenAsync(string token)
        {
            return await _dbSet
                .Where(prt => prt.Token == token)
                .FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<PasswordResetToken>> GetExpiredTokensAsync()
        {
            return await _dbSet
                .Where(prt => prt.ExpiresAt <= DateTime.UtcNow)
                .ToListAsync();
        }

        public async Task CleanupExpiredTokensAsync()
        {
            var expiredTokens = await GetExpiredTokensAsync();
            _dbSet.RemoveRange(expiredTokens);
        }

        public async Task<int> GetActiveTokenCountAsync(string userId)
        {
            return await _dbSet
                .CountAsync(prt => prt.UserId == userId && prt.ExpiresAt > DateTime.UtcNow);
        }
    }
} 