using Microsoft.AspNetCore.Identity.UI.Services;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.DOMAIN.Models;

namespace SecureAuth.INFRASTRUCTURE.Services
{
    public class EmailSenderAdapter : IEmailSender
    {
        private readonly IEmailService _emailService;

        public EmailSenderAdapter(IEmailService emailService)
        {
            _emailService = emailService;
        }

        public Task SendEmailAsync(string email, string subject, string htmlMessage)
        {
            var message = new Message(new[] { email }, subject, htmlMessage);
            _emailService.SendEmail(message);
            return Task.CompletedTask;
        }
    }
} 