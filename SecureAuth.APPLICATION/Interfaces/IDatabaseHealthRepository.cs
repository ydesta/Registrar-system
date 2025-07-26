using System.Threading.Tasks;

namespace SecureAuth.APPLICATION.Interfaces
{
    public interface IDatabaseHealthRepository
    {
        Task<bool> CheckConnectionAsync();
        Task<int> GetResponseTimeAsync();
        Task<int> GetActiveConnectionsAsync();
    }
} 
