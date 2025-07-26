using SecureAuth.DOMAIN.Models;
using System;
using System.Threading.Tasks;

namespace SecureAuth.APPLICATION.Interfaces
{
    public interface IEmailService
    {
        void SendEmail(Message message);
        Task SendEmailAsync(Message message);
        Task SendPasswordResetEmailAsync(string to, string resetLink, DateTime expiresAt);
        Task SendTemporaryPasswordEmailAsync(string to, string username, string tempPassword);
        Task SendPasswordResetAsync(string email, string token);
        Task SendAccountBlockedNotificationAsync(string email, string reason, DateTime? blockUntil);
        Task SendAccountUnblockedNotificationAsync(string email, string reason);
        Task SendEmailConfirmationAsync(string email, string token);
        Task SendEmailConfirmationWithUrlAsync(string email, string token, string baseUrl);
        Task SendUserCredentialsAsync(string email, string username, string password, string firstName, string lastName);
        Task SendUpdatedCredentialsAsync(string email, string username, string firstName, string lastName, string updateType);
        Task SendOtpEmailAsync(string email, string otp, string purpose, DateTime expiresAt);
        Task SendActionEmailAsync(string email, string token, string actionType, string actionUrl, DateTime expiresAt, string customMessage = null);
    }
} 
