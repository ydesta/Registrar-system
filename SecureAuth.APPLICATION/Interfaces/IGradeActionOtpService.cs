using System.Threading.Tasks;

namespace SecureAuth.APPLICATION.Interfaces
{
    public class GradeActionOtpResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? Token { get; set; }
        public int ExpiresInSeconds { get; set; }
        public string? EmailHint { get; set; }
    }

    public interface IGradeActionOtpService
    {
        Task<GradeActionOtpResult> SendAsync(string userId, string purpose);
        Task<GradeActionOtpResult> VerifyAsync(string userId, string purpose, string otp);
    }
}
