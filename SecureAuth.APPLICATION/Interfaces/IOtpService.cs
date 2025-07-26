using System.Threading.Tasks;

namespace SecureAuth.APPLICATION.Interfaces
{
    public interface IOtpService
    {
        Task<string> GenerateOtpAsync(string userId);
        Task<string> GenerateOtpAsync(string userId, string email, string purpose = "Login");
        Task<bool> ValidateOtpAsync(string userId, string otp);
        Task<bool> IsOtpExpiredAsync(string userId);
        Task<bool> InvalidateOtpAsync(string userId);
        Task<bool> VerifyOtpAsync(string userId, string otp, string? purpose = null);
        Task RevokeOtpAsync(string userId);
        Task<bool> HasValidOtpAsync(string userId);
        Task<DateTime?> GetOtpExpiryAsync(string userId);
    }
} 
