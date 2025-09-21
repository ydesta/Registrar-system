using Microsoft.EntityFrameworkCore;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.INFRASTRUCTURE.Data;
using SecureAuth.DOMAIN.Models;

namespace SecureAuth.INFRASTRUCTURE.Services.Repositories
{
    public class UserCredentialRepository : Repository<UserCredential>, IUserCredentialRepository
    {
        public UserCredentialRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<UserCredential> GetByEmailAsync(string email)
        {
            return await _dbSet.FirstOrDefaultAsync(uc => uc.Email == email);
        }

        public async Task<IEnumerable<UserCredential>> GetByDateRangeAsync(DateTime startDate, DateTime endDate)
        {
            return await _dbSet
                .Where(uc => uc.CreatedAt >= startDate && uc.CreatedAt <= endDate)
                .OrderByDescending(uc => uc.CreatedAt)
                .ToListAsync();
        }

        public async Task<bool> ExistsByEmailAsync(string email)
        {
            return await _dbSet.AnyAsync(uc => uc.Email == email);
        }

        public IQueryable<UserCredential> Query()
        {
            return _dbSet.AsQueryable();
        }
    }
}
