using SecureAuth.APPLICATION.DTOs.Security;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SecureAuth.APPLICATION.Interfaces
{
    public interface IPasswordManagementService
    {
        Task<PasswordResponse> ChangePasswordAsync(string userId, ChangePasswordRequest request);
        Task<PasswordResponse> ForgotPasswordAsync(ForgotPasswordRequest request);
        Task<PasswordResponse> ResetPasswordAsync(ResetPasswordRequest request);
        Task<PasswordResponse> ValidatePasswordAsync(PasswordValidationRequest request);
        Task<bool> IsPasswordExpiredAsync(string userId);
        Task<List<PasswordHistoryEntry>> GetPasswordHistoryAsync(string userId);
        Task<PasswordPolicyInfo> GetPasswordPolicyAsync();
        Task<bool> ForcePasswordChangeAsync(string userId, string reason = "Admin Reset");
        Task<(bool Success, string Message)> RegenerateAndSendPasswordAsync(string userId);
    }
} 
