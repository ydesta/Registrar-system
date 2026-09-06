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
                "password_reset" => "Password Reset Request - HiLCoE Registrar",
                "email_verification" => "Confirm Your HiLCoE Applicant Email",
                _ => "Action Required - HiLCoE Registrar"
            };
        }

        private static bool IsNonExpiring(string actionType, DateTime expiresAt)
        {
            return actionType.Equals("email_verification", StringComparison.OrdinalIgnoreCase)
                || expiresAt == DateTime.MaxValue
                || expiresAt.Year >= 9000;
        }

        private string GetExpiryText(string actionType, DateTime expiresAt)
        {
            if (IsNonExpiring(actionType, expiresAt))
            {
                return "This confirmation link does not expire. You can use it anytime to activate your account.";
            }

            return $"This link will expire at {expiresAt:g} UTC.";
        }

        private string GetPlainTextContent(string actionType, string url, DateTime expiresAt, string customMessage)
        {
            var actionInstructions = actionType.ToLower() switch
            {
                "password_reset" => "You have requested to reset your password. Please click the link below to reset your password:",
                "email_verification" => "Thank you for registering as an applicant with HiLCoE. To complete your registration, please confirm your email address by clicking the link below:",
                _ => customMessage ?? "Please click the link below to complete this action:"
            };

            return $@"
Dear Applicant,

{actionInstructions}

{url}

If the link above doesn't work, you can copy and paste the following URL into your browser:
{url}

{GetExpiryText(actionType, expiresAt)}

If you didn't request this action, please ignore this email.

Best regards,
HiLCoE Registrar Office";
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
                "email_verification" => "Thank you for registering as an applicant with HiLCoE. To complete your registration, please confirm your email address by clicking the button below:",
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

            var expiryText = GetExpiryText(actionType, expiresAt);

            return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <title>{title}</title>
</head>
<body style='margin:0;padding:0;background:#f5f7fa;font-family:Arial,Helvetica,sans-serif;color:#333;'>
    <div style='max-width:600px;margin:24px auto;padding:0 16px;'>
        <div style='background:{headerColor};color:#ffffff;padding:20px;text-align:center;border-radius:8px 8px 0 0;'>
            <h1 style='margin:0;font-size:22px;'>{title}</h1>
        </div>
        <div style='background:#ffffff;padding:24px;border:1px solid #e8eef5;border-top:none;border-radius:0 0 8px 8px;'>
            <p>Dear Applicant,</p>
            <p>{actionInstructions}</p>
            <p style='text-align:center;margin:28px 0;'>
                <a href='{url}' style='display:inline-block;background:{buttonColor};color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;'>{buttonText}</a>
            </p>
            <p>If the button above doesn't work, copy and paste this URL into your browser:</p>
            <p style='word-break:break-all;background:#f1f5f9;padding:12px;border-radius:6px;font-size:13px;'>{url}</p>
            <p><strong>{expiryText}</strong></p>
            <p>If you didn't request this action, please ignore this email.</p>
            <p>Best regards,<br>HiLCoE Registrar Office</p>
        </div>
        <p style='text-align:center;margin-top:16px;color:#6c757d;font-size:12px;'>This is an automated message from HiLCoE Registrar. Please do not reply to this email.</p>
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
