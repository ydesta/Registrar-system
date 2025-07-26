using SecureAuth.DOMAIN.Models;
using System;
using System.Threading.Tasks;

namespace SecureAuth.DOMAIN.Interfaces
{
    public interface IEmailService
    {
        void SendEmail(Message message);
        Task SendEmailAsync(Message message);
        Task SendPasswordResetEmailAsync(string to, string resetLink, DateTime expiresAt);
        Task SendTemporaryPasswordEmailAsync(string to, string username, string tempPassword);
        Task SendActionEmailAsync(string email, string token, string actionType, string actionUrl, DateTime expiresAt, string customMessage = null);
    }
} 