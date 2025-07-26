using System.Threading.Tasks;

namespace SecureAuth.DOMAIN.Interfaces
{
    public interface IOtpService
    {
        Task<string> GenerateOtpAsync(string userId);
        Task<bool> ValidateOtpAsync(string userId, string otp);
        Task<bool> IsOtpExpiredAsync(string userId);
        Task<bool> InvalidateOtpAsync(string userId);
    }
} 