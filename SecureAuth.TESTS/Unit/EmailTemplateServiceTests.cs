using Xunit;
using SecureAuth.INFRASTRUCTURE.Services;
using System;

namespace SecureAuth.TESTS.Unit
{
    public class EmailTemplateServiceTests
    {
        private readonly EmailTemplateService _emailTemplateService;

        public EmailTemplateServiceTests()
        {
            _emailTemplateService = new EmailTemplateService("http://localhost:4200");
        }

        [Fact]
        public void CreateActionEmailTemplate_ForPasswordReset_ShouldGenerateCorrectTemplate()
        {
            // Arrange
            var email = "test@example.com";
            var token = "test-token-123";
            var actionType = "password_reset";
            var actionUrl = "http://localhost:4200/accounts/reset-password";
            var expiresAt = DateTime.UtcNow.AddHours(24);

            // Act
            var template = _emailTemplateService.CreateActionEmailTemplate(email, token, actionType, actionUrl, expiresAt);

            // Assert
            Assert.NotNull(template);
            Assert.Equal("Password Reset Request", template.Subject);
            Assert.Contains("You have requested to reset your password", template.Content);
            Assert.Contains("Reset Password", template.HtmlContent);
            Assert.Contains("test@example.com", template.HtmlContent);
            Assert.Contains("test-token-123", template.HtmlContent);
            Assert.Contains("http://localhost:4200/accounts/reset-password", template.HtmlContent);
        }

        [Fact]
        public void CreateActionEmailTemplate_ForEmailVerification_ShouldGenerateCorrectTemplate()
        {
            // Arrange
            var email = "test@example.com";
            var token = "test-token-123";
            var actionType = "email_verification";
            var actionUrl = "http://localhost:4200/accounts/verify-email";
            var expiresAt = DateTime.UtcNow.AddHours(24);

            // Act
            var template = _emailTemplateService.CreateActionEmailTemplate(email, token, actionType, actionUrl, expiresAt);

            // Assert
            Assert.NotNull(template);
            Assert.Equal("Confirm Your Email Address", template.Subject);
            Assert.Contains("Thank you for registering with our application", template.Content);
            Assert.Contains("Confirm Email Address", template.HtmlContent);
            Assert.Contains("test@example.com", template.HtmlContent);
            Assert.Contains("test-token-123", template.HtmlContent);
            Assert.Contains("http://localhost:4200/accounts/verify-email", template.HtmlContent);
        }

        [Fact]
        public void CreateActionEmailTemplate_WithCustomMessage_ShouldUseCustomMessage()
        {
            // Arrange
            var email = "test@example.com";
            var token = "test-token-123";
            var actionType = "custom_action";
            var actionUrl = "http://localhost:4200/custom-action";
            var expiresAt = DateTime.UtcNow.AddHours(24);
            var customMessage = "This is a custom message for testing.";

            // Act
            var template = _emailTemplateService.CreateActionEmailTemplate(email, token, actionType, actionUrl, expiresAt, customMessage);

            // Assert
            Assert.NotNull(template);
            Assert.Equal("Action Required", template.Subject);
            Assert.Contains(customMessage, template.Content);
            Assert.Contains(customMessage, template.HtmlContent);
        }

        [Fact]
        public void CreateActionEmailTemplate_ShouldEscapeUrlParameters()
        {
            // Arrange
            var email = "test+user@example.com";
            var token = "token with spaces & special chars";
            var actionType = "password_reset";
            var actionUrl = "http://localhost:4200/reset-password";
            var expiresAt = DateTime.UtcNow.AddHours(24);

            // Act
            var template = _emailTemplateService.CreateActionEmailTemplate(email, token, actionType, actionUrl, expiresAt);

            // Assert
            Assert.NotNull(template);
            Assert.Contains("test%2Buser%40example.com", template.HtmlContent);
            Assert.Contains("token%20with%20spaces%20%26%20special%20chars", template.HtmlContent);
        }
    }
} 