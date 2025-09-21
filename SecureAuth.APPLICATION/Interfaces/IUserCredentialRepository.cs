using SecureAuth.DOMAIN.Models;
using System.Linq;

namespace SecureAuth.APPLICATION.Interfaces
{
    public interface IUserCredentialRepository : IRepository<UserCredential>
    {
        Task<UserCredential> GetByEmailAsync(string email);
        Task<IEnumerable<UserCredential>> GetByDateRangeAsync(DateTime startDate, DateTime endDate);
        Task<bool> ExistsByEmailAsync(string email);
        IQueryable<UserCredential> Query();
    }
}
