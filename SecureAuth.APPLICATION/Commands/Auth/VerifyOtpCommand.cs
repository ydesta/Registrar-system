using SecureAuth.APPLICATION.DTOs.Authentication;

namespace SecureAuth.APPLICATION.Commands.Auth
{
    public class VerifyOtpCommand : ICommand<OtpVerifyResponse>
    {
        public string Email { get; set; } = string.Empty;
        public string OtpCode { get; set; } = string.Empty;
        public string Purpose { get; set; } = "Login"; // "Login", "EmailVerification", "PhoneVerification"
    }
} 
