using System;

namespace SecureAuth.INFRASTRUCTURE.Services
{
    public class EmailTemplateService
    {
        private readonly string _frontendUrl;

        public EmailTemplateService(string frontendUrl)
        {
            _frontendUrl = frontendUrl;
        }

        public EmailTemplate CreateActionEmailTemplate(
            string email, 
            string token, 
            string actionType, 
            string actionUrl, 
            DateTime expiresAt,
            string customMessage = null)
        {
            var url = $"{actionUrl}?email={Uri.EscapeDataString(email)}&token={Uri.EscapeDataString(token)}";
            
            var subject = GetSubject(actionType);
            var content = GetPlainTextContent(actionType, url, expiresAt, customMessage);
            var htmlContent = GetHtmlContent(actionType, url, expiresAt, customMessage);

            return new EmailTemplate
            {
                Subject = subject,
                Content = content,
                HtmlContent = htmlContent
            };
        }

        private string GetSubject(string actionType)
        {
            return actionType.ToLower() switch
            {
                "password_reset" => "Password Reset Request",
                "email_verification" => "Confirm Your Email Address",
                _ => "Action Required"
            };
        }

        private string GetPlainTextContent(string actionType, string url, DateTime expiresAt, string customMessage)
        {
            var actionDescription = actionType.ToLower() switch
            {
                "password_reset" => "reset your password",
                "email_verification" => "confirm your email address",
                _ => "complete this action"
            };

            var actionInstructions = actionType.ToLower() switch
            {
                "password_reset" => "You have requested to reset your password. Please click the link below to reset your password:",
                "email_verification" => "Thank you for registering with our application. To complete your registration, please confirm your email address by clicking the link below:",
                _ => customMessage ?? "Please click the link below to complete this action:"
            };

            return $@"
                    Dear User,

                    {actionInstructions}

                    {url}

                    If the link above doesn't work, you can copy and paste the following URL into your browser:
                    {url}

                    This link will expire at {expiresAt:g}.

                    If you didn't request this action, please ignore this email.

                    Best regards,
                    The SecureAuth Team";
        }

        private string GetHtmlContent(string actionType, string url, DateTime expiresAt, string customMessage)
        {
            var title = actionType.ToLower() switch
            {
                "password_reset" => "Password Reset",
                "email_verification" => "Email Confirmation",
                _ => "Action Required"
            };

            var buttonText = actionType.ToLower() switch
            {
                "password_reset" => "Reset Password",
                "email_verification" => "Confirm Email Address",
                _ => "Complete Action"
            };

            var actionInstructions = actionType.ToLower() switch
            {
                "password_reset" => "You have requested to reset your password. Please click the button below to reset your password:",
                "email_verification" => "Thank you for registering with our application. To complete your registration, please confirm your email address by clicking the button below:",
                _ => customMessage ?? "Please click the button below to complete this action:"
            };

            var headerColor = actionType.ToLower() switch
            {
                "password_reset" => "#dc3545",
                "email_verification" => "#007bff",
                _ => "#6c757d"
            };

            var buttonColor = actionType.ToLower() switch
            {
                "password_reset" => "#dc3545",
                "email_verification" => "#007bff",
                _ => "#6c757d"
            };

            return $@"
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset='utf-8'>
                        <title>{title}</title>
                        <style>
                            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                            .header {{ background-color: {headerColor}; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
                            .content {{ background-color: #f8f9fa; padding: 20px; border-radius: 0 0 5px 5px; }}
                            .button {{ display: inline-block; background-color: {buttonColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }}
                            .footer {{ text-align: center; margin-top: 20px; color: #6c757d; font-size: 0.9em; }}
                            .url-box {{ word-break: break-all; background-color: #e9ecef; padding: 10px; border-radius: 5px; margin: 15px 0; }}
                        </style>
                    </head>
                    <body>
                        <div class='container'>
                            <div class='header'>
                                <h1>{title}</h1>
                            </div>
                            <div class='content'>
                                <p>Dear User,</p>
                                <p>{actionInstructions}</p>

                                <div style='text-align: center;'>
                                    <a href='{url}' class='button'>{buttonText}</a>
                                </div>

                                <p>If the button above doesn't work, you can copy and paste the following URL into your browser:</p>
                                <div class='url-box'>{url}</div>

                                <p><strong>This link will expire at {expiresAt:g}.</strong></p>

                                <p>If you didn't request this action, please ignore this email.</p>

                                <p>Best regards,<br>The SecureAuth Team</p>
                            </div>
                            <div class='footer'>
                                <p>This is an automated message, please do not reply to this email.</p>
                            </div>
                        </div>
                    </body>
                    </html>";
        }
    }

    public class EmailTemplate
    {
        public string Subject { get; set; }
        public string Content { get; set; }
        public string HtmlContent { get; set; }
    }
} 