using SecureAuth.DOMAIN.Models;
using SecureAuth.APPLICATION.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using System.Threading.Tasks;
using System;
using System.Linq;

namespace SecureAuth.INFRASTRUCTURE.Services
{
    public class EmailService : IEmailService
    {
        private readonly EmailConfiguration _emailConfiguration;
        private readonly string _frontendUrl;
        private readonly EmailTemplateService _emailTemplateService;
        private readonly ILogger<EmailService> _logger;
        
        public EmailService(IConfiguration configuration, EmailTemplateService emailTemplateService, ILogger<EmailService> logger)
        {
            _emailConfiguration = new EmailConfiguration
            {
                From = configuration["EmailConfiguration:From"],
                SmtpServer = configuration["EmailConfiguration:SmtpServer"],
                Port = int.Parse(configuration["EmailConfiguration:Port"] ?? "587"),
                UserName = configuration["EmailConfiguration:UserName"],
                Password = configuration["EmailConfiguration:Password"],
                BaseUrl = configuration["EmailConfiguration:BaseUrl"]
            };
            
            _frontendUrl = configuration["AppSettings:FrontendUrl"] ?? "http://localhost:4200";
            _emailTemplateService = emailTemplateService;
            _logger = logger;
            
            // Log email configuration (without sensitive data)
            _logger.LogInformation("EmailService initialized with SMTP Server: {SmtpServer}, Port: {Port}, From: {From}", 
                _emailConfiguration.SmtpServer, _emailConfiguration.Port, _emailConfiguration.From);
        }
        
        public void SendEmail(Message message)
        {
            var emailMessage = CreateEmailMessage(message);
            Send(emailMessage);
        }

        public async Task SendEmailAsync(Message message)
        {
            var emailMessage = CreateEmailMessage(message);
            await SendAsync(emailMessage);
        }

        public async Task SendPasswordResetEmailAsync(string to, string resetLink, DateTime expiresAt)
        {
            var resetUrl = $"{_frontendUrl}/accounts/reset-password";
            await SendActionEmailAsync(to, resetLink, "password_reset", resetUrl, expiresAt);
        }

        public async Task SendTemporaryPasswordEmailAsync(string to, string username, string tempPassword)
        {
            var loginUrl = $"{_frontendUrl}/login";
            var subject = "Your Temporary Password - SecureAuth";
            var content = $@"
                    Dear User,

                    Your password has been reset by an administrator. Here are your updated login credentials:

                    Username: {username}
                    Password: {tempPassword}

                    You can log in to your account using the following link:
                    {loginUrl}

                    For security reasons, please change your password after your first login.

                    If you have any questions, please contact the system administrator.

                    Best regards,
                    The SecureAuth Team";

            var htmlContent = $@"
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset='utf-8'>
                        <title>Temporary Password</title>
                        <style>
                            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                            .header {{ background-color: #ffc107; color: #212529; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
                            .content {{ background-color: #f8f9fa; padding: 20px; border-radius: 0 0 5px 5px; }}
                            .credentials {{ background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 15px 0; }}
                            .button {{ display: inline-block; background-color: #ffc107; color: #212529; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }}
                            .footer {{ text-align: center; margin-top: 20px; color: #6c757d; font-size: 0.9em; }}
                        </style>
                    </head>
                    <body>
                        <div class='container'>
                            <div class='header'>
                                <h1>Temporary Password</h1>
                            </div>
                            <div class='content'>
                                <p>Dear User,</p>
                                <p>Your password has been reset by an administrator. Here are your updated login credentials:</p>
                                <div class='credentials'>
                                    <p><strong>Username:</strong> {username}</p>
                                    <p><strong>Password:</strong> {tempPassword}</p>
                                </div>
                                <div style='text-align: center;'>
                                    <a href='{loginUrl}' class='button'>Login to Your Account</a>
                                </div>
                                <p><strong>For security reasons, please change your password after your first login.</strong></p>
                                <p>If you have any questions, please contact the system administrator.</p>
                                <p>Best regards,<br>The SecureAuth Team</p>
                            </div>
                            <div class='footer'>
                                <p>This is an automated message, please do not reply to this email.</p>
                            </div>
                        </div>
                    </body>
                    </html>";

            var message = new Message(new string[] { to }, subject, content, htmlContent);
            await SendEmailAsync(message);
        }

        public async Task SendActionEmailAsync(string email, string token, string actionType, string actionUrl, DateTime expiresAt, string customMessage = null)
        {
            try
            {
                _logger.LogInformation("Sending action email to {Email} for action type: {ActionType}", email, actionType);
                
                var template = _emailTemplateService.CreateActionEmailTemplate(email, token, actionType, actionUrl, expiresAt, customMessage);
                var message = new Message(new[] { email }, template.Subject, template.Content, template.HtmlContent);
                await SendEmailAsync(message);
                
                _logger.LogInformation("Successfully sent action email to {Email} for action type: {ActionType}", email, actionType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send action email to {Email} for action type: {ActionType}. Error: {ErrorMessage}", 
                    email, actionType, ex.Message);
                throw;
            }
        }

        public async Task SendPasswordResetAsync(string email, string token)
        {
            var resetUrl = $"{_frontendUrl}/accounts/reset-password";
            await SendActionEmailAsync(email, token, "password_reset", resetUrl, DateTime.UtcNow.AddHours(24));
        }

        public async Task SendAccountBlockedNotificationAsync(string email, string reason, DateTime? blockUntil)
        {
            var subject = "Account Blocked";
            var blockInfo = blockUntil.HasValue ? $"until {blockUntil.Value:g}" : "permanently";
            var content = $"Your account has been blocked {blockInfo}. Reason: {reason}";
            var message = new Message(new[] { email }, subject, content);
            await SendEmailAsync(message);
        }

        public async Task SendAccountUnblockedNotificationAsync(string email, string reason)
        {
            var subject = "Account Unblocked";
            var content = $"Your account has been unblocked. Reason: {reason}";
            var message = new Message(new[] { email }, subject, content);
            await SendEmailAsync(message);
        }

        public async Task SendEmailConfirmationAsync(string email, string token)
        {
            var confirmationUrl = $"{_frontendUrl}/accounts/verify-email";
            await SendActionEmailAsync(email, token, "email_verification", confirmationUrl, DateTime.UtcNow.AddHours(24));
        }

        public async Task SendEmailConfirmationWithUrlAsync(string email, string token, string baseUrl)
        {
            var confirmationUrl = $"{baseUrl}/accounts/verify-email";
            await SendActionEmailAsync(email, token, "email_verification", confirmationUrl, DateTime.UtcNow.AddHours(24));
        }

        public async Task SendUserCredentialsAsync(string email, string username, string password, string firstName, string lastName)
        {
            try
            {
                _logger.LogInformation("Sending user credentials email to {Email} for user: {Username}", email, username);
                
                var loginUrl = $"{_frontendUrl}/login";
                
                var subject = "Your Account Credentials - SecureAuth";
                var content = $@"
                Dear {firstName} {lastName},

                Your account has been created by the system administrator. Here are your login credentials:

                Username: {username}
                Password: {password}

                You can log in to your account using the following link:
                {loginUrl}

                For security reasons, please change your password after your first login.

                If you have any questions, please contact the system administrator.

                Best regards,
                The SecureAuth Team";

                            var htmlContent = $@"
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset='utf-8'>
                    <title>Account Credentials</title>
                    <style>
                        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                        .header {{ background-color: #ffc107; color: #212529; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
                        .content {{ background-color: #f8f9fa; padding: 20px; border-radius: 0 0 5px 5px; }}
                        .credentials {{ background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 15px 0; }}
                        .button {{ display: inline-block; background-color: #ffc107; color: #212529; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }}
                        .footer {{ text-align: center; margin-top: 20px; color: #6c757d; font-size: 0.9em; }}
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <div class='header'>
                            <h1>Account Credentials</h1>
                        </div>
                        <div class='content'>
                            <p>Dear {firstName} {lastName},</p>
                            <p>Your account has been created by the system administrator. Here are your login credentials:</p>
                            
                            <div class='credentials'>
                                <p><strong>Username:</strong> {username}</p>
                                <p><strong>Password:</strong> {password}</p>
                            </div>
                            
                            <div style='text-align: center;'>
                                <a href='{loginUrl}' class='button'>Login to Your Account</a>
                            </div>
                            
                            <p><strong>For security reasons, please change your password after your first login.</strong></p>
                            
                            <p>If you have any questions, please contact the system administrator.</p>
                            
                            <p>Best regards,<br>The SecureAuth Team</p>
                        </div>
                        <div class='footer'>
                            <p>This is an automated message, please do not reply to this email.</p>
                        </div>
                    </div>
                </body>
                </html>";

                var message = new Message(new[] { email }, subject, content, htmlContent);
                await SendEmailAsync(message);
                
                _logger.LogInformation("Successfully sent user credentials email to {Email} for user: {Username}", email, username);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send user credentials email to {Email} for user: {Username}. Error: {ErrorMessage}", 
                    email, username, ex.Message);
                throw;
            }
        }

        public async Task SendUpdatedCredentialsAsync(string email, string username, string firstName, string lastName, string updateType)
        {
            try
            {
                _logger.LogInformation("Sending updated credentials email to {Email} for user: {Username}, update type: {UpdateType}", 
                    email, username, updateType);
                
                var loginUrl = $"{_frontendUrl}/login";
                var subject = $"Your Account {updateType} Updated - SecureAuth";
                var content = $@"
                Dear {firstName} {lastName},

                Your account {updateType.ToLower()} has been updated by the system administrator. Here are your updated login credentials:

                Username: {username}

                You can log in to your account using the following link:
                {loginUrl}

                If you have any questions, please contact the system administrator.

                Best regards,
                The SecureAuth Team";

            var htmlContent = $@"
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset='utf-8'>
                    <title>Account {updateType} Updated</title>
                    <style>
                        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                        .header {{ background-color: #28a745; color: #fff; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
                        .content {{ background-color: #f8f9fa; padding: 20px; border-radius: 0 0 5px 5px; }}
                        .credentials {{ background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 15px 0; }}
                        .button {{ display: inline-block; background-color: #28a745; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }}
                        .footer {{ text-align: center; margin-top: 20px; color: #6c757d; font-size: 0.9em; }}
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <div class='header'>
                            <h1>Account {updateType} Updated</h1>
                        </div>
                        <div class='content'>
                            <p>Dear {firstName} {lastName},</p>
                            <p>Your account {updateType.ToLower()} has been updated by the system administrator. Here are your updated login credentials:</p>
                            
                            <div class='credentials'>
                                <p><strong>Username:</strong> {username}</p>
                            </div>
                            
                            <div style='text-align: center;'>
                                <a href='{loginUrl}' class='button'>Login to Your Account</a>
                            </div>
                            
                            <p>If you have any questions, please contact the system administrator.</p>
                            
                            <p>Best regards,<br>The SecureAuth Team</p>
                        </div>
                        <div class='footer'>
                            <p>This is an automated message, please do not reply to this email.</p>
                        </div>
                    </div>
                </body>
                </html>";

                var message = new Message(new[] { email }, subject, content, htmlContent);
                await SendEmailAsync(message);
                
                _logger.LogInformation("Successfully sent updated credentials email to {Email} for user: {Username}, update type: {UpdateType}", 
                    email, username, updateType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send updated credentials email to {Email} for user: {Username}, update type: {UpdateType}. Error: {ErrorMessage}", 
                    email, username, updateType, ex.Message);
                throw;
            }
        }

        public async Task SendOtpEmailAsync(string email, string otp, string purpose, DateTime expiresAt)
        {
            try
            {
                _logger.LogInformation("Sending OTP email to {Email} for purpose: {Purpose}", email, purpose);
                
                var subject = $"Your {purpose} Verification Code - SecureAuth";
                var content = $@"
                Dear User,

                You have requested a {purpose.ToLower()} verification code. Here is your one-time password (OTP):

                {otp}

                This code will expire at {expiresAt:g} UTC.

                If you didn't request this code, please ignore this email and contact support immediately.

                For security reasons:
                - Never share this code with anyone
                - This code will expire in 5 minutes
                - Each code can only be used once

                Best regards,
                The SecureAuth Team";

            var htmlContent = $@"
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset='utf-8'>
                    <title>{purpose} Verification Code</title>
                    <style>
                        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                        .header {{ background-color: #1890ff; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
                        .content {{ background-color: #f8f9fa; padding: 20px; border-radius: 0 0 5px 5px; }}
                        .otp-code {{ background-color: #e6f7ff; border: 2px solid #1890ff; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #1890ff; }}
                        .warning {{ background-color: #fff2e8; border: 1px solid #ffbb96; padding: 15px; border-radius: 5px; margin: 20px 0; }}
                        .footer {{ text-align: center; margin-top: 20px; color: #6c757d; font-size: 0.9em; }}
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <div class='header'>
                            <h1>{purpose} Verification Code</h1>
                        </div>
                        <div class='content'>
                            <p>Dear User,</p>
                            <p>You have requested a {purpose.ToLower()} verification code. Here is your one-time password (OTP):</p>
                            
                            <div class='otp-code'>
                                {otp}
                            </div>
                            
                            <p><strong>This code will expire at {expiresAt:g} UTC.</strong></p>
                            
                            <div class='warning'>
                                <p><strong>⚠️ Security Notice:</strong></p>
                                <ul>
                                    <li>Never share this code with anyone</li>
                                    <li>This code will expire in 5 minutes</li>
                                    <li>Each code can only be used once</li>
                                </ul>
                            </div>
                            
                            <p>If you didn't request this code, please ignore this email and contact support immediately.</p>
                            
                            <p>Best regards,<br>The SecureAuth Team</p>
                        </div>
                        <div class='footer'>
                            <p>This is an automated message, please do not reply to this email.</p>
                        </div>
                    </div>
                </body>
                </html>";

                var message = new Message(new[] { email }, subject, content, htmlContent);
                await SendEmailAsync(message);
                
                _logger.LogInformation("Successfully sent OTP email to {Email} for purpose: {Purpose}", email, purpose);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send OTP email to {Email} for purpose: {Purpose}. Error: {ErrorMessage}", 
                    email, purpose, ex.Message);
                throw;
            }
        }

        private void Send(MimeMessage mailMessage)
        {
            using var client = new SmtpClient();
            try
            {
                _logger.LogInformation("Connecting to SMTP server: {SmtpServer}:{Port}", _emailConfiguration.SmtpServer, _emailConfiguration.Port);
                client.Timeout = 10000; 
                client.ServerCertificateValidationCallback = (s, c, h, e) => true;
                if (_emailConfiguration.Port == 587)
                {
                    client.Connect(_emailConfiguration.SmtpServer, _emailConfiguration.Port, MailKit.Security.SecureSocketOptions.StartTls);
                }
                else if (_emailConfiguration.Port == 465)
                {
                    client.Connect(_emailConfiguration.SmtpServer, _emailConfiguration.Port, MailKit.Security.SecureSocketOptions.SslOnConnect);
                }
                else
                {
                    client.Connect(_emailConfiguration.SmtpServer, _emailConfiguration.Port, MailKit.Security.SecureSocketOptions.StartTls);
                }
                
                client.AuthenticationMechanisms.Remove("XOAUTH2");
                
                _logger.LogInformation("Authenticating with SMTP server using username: {UserName}", _emailConfiguration.UserName);
                client.Authenticate(_emailConfiguration.UserName, _emailConfiguration.Password);

                _logger.LogInformation("Sending email to: {To}", string.Join(", ", mailMessage.To.Select(t => t.Name)));
                client.Send(mailMessage);
                
                _logger.LogInformation("Email sent successfully to: {To}", string.Join(", ", mailMessage.To.Select(t => t.Name)));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email to: {To}. SMTP Server: {SmtpServer}:{Port}, Username: {UserName}. Error: {ErrorMessage}", 
                    string.Join(", ", mailMessage.To.Select(t => t.Name)), 
                    _emailConfiguration.SmtpServer, 
                    _emailConfiguration.Port, 
                    _emailConfiguration.UserName, 
                    ex.Message);
                throw;
            }
            finally
            {
                if (client.IsConnected)
                {
                    client.Disconnect(true);
                }
                client.Dispose();
            }
        }

        private async Task SendAsync(MimeMessage mailMessage)
        {
            using var client = new SmtpClient();
            try
            {
                _logger.LogInformation("Connecting to SMTP server: {SmtpServer}:{Port}", _emailConfiguration.SmtpServer, _emailConfiguration.Port);
                client.Timeout = 10000; 
                client.ServerCertificateValidationCallback = (s, c, h, e) => true;
                if (_emailConfiguration.Port == 587)
                {
                    await client.ConnectAsync(_emailConfiguration.SmtpServer, _emailConfiguration.Port, MailKit.Security.SecureSocketOptions.StartTls);
                }
                else if (_emailConfiguration.Port == 465)
                {
                    await client.ConnectAsync(_emailConfiguration.SmtpServer, _emailConfiguration.Port, MailKit.Security.SecureSocketOptions.SslOnConnect);
                }
                else
                {
                    await client.ConnectAsync(_emailConfiguration.SmtpServer, _emailConfiguration.Port, MailKit.Security.SecureSocketOptions.StartTls);
                }
                client.AuthenticationMechanisms.Remove("XOAUTH2");
                _logger.LogInformation("Authenticating with SMTP server using username: {UserName}", _emailConfiguration.UserName);
                await client.AuthenticateAsync(_emailConfiguration.UserName, _emailConfiguration.Password);
                _logger.LogInformation("Sending email to: {To}", string.Join(", ", mailMessage.To.Select(t => t.Name)));
                await client.SendAsync(mailMessage);
                _logger.LogInformation("Email sent successfully to: {To}", string.Join(", ", mailMessage.To.Select(t => t.Name)));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email to: {To}. SMTP Server: {SmtpServer}:{Port}, Username: {UserName}. Error: {ErrorMessage}", 
                    string.Join(", ", mailMessage.To.Select(t => t.Name)), 
                    _emailConfiguration.SmtpServer, 
                    _emailConfiguration.Port, 
                    _emailConfiguration.UserName, 
                    ex.Message);
                throw;
            }
            finally
            {
                if (client.IsConnected)
                {
                    await client.DisconnectAsync(true);
                }
                client.Dispose();
            }
        }

        private MimeMessage CreateEmailMessage(Message message)
        {
            var emailMessage = new MimeMessage();
            emailMessage.From.Add(new MailboxAddress("SecureAuth", _emailConfiguration.From));
            foreach (var recipient in message.To)
            {
                emailMessage.To.Add(recipient);
            }
            
            emailMessage.Subject = message.Subject;
            
            var textPart = new TextPart(MimeKit.Text.TextFormat.Text) { Text = message.Content };
            var htmlPart = new TextPart(MimeKit.Text.TextFormat.Html) { Text = message.HtmlContent };
            
            var multipart = new MultipartAlternative();
            multipart.Add(textPart);
            multipart.Add(htmlPart);
            
            emailMessage.Body = multipart;
            return emailMessage;
        }
    }
} 