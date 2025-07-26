using System.Threading.Tasks;

namespace SecureAuth.DOMAIN.Interfaces
{
    public interface IRateLimitingService
    {
        Task<bool> IsRateLimitExceededAsync(string identifier, int maxRequests, int windowMinutes);
        Task<int> GetRemainingRequestsAsync(string identifier, int maxRequests, int windowMinutes);
        Task<bool> IncrementRequestCountAsync(string identifier);
        Task<bool> ResetRateLimitAsync(string identifier);
    }
} 