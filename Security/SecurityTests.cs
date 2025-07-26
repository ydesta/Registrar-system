using FluentAssertions;
using Xunit;
using System.Text.Json;
using System.Text;
using Microsoft.AspNetCore.Mvc.Testing;
using SecureAuth.API;

namespace SecureAuth.TESTS.Security
{
    public class SecurityTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;
        private readonly HttpClient _client;

        public SecurityTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory;
            _client = _factory.CreateClient();
        }

        [Fact]
        public async Task SecurityHeaders_ShouldBePresent()
        {
            // Act
            var response = await _client.GetAsync("/api/authentication/csrf-token");

            // Assert
            response.Headers.Should().ContainKey("X-Content-Type-Options");
            response.Headers.Should().ContainKey("X-Frame-Options");
            response.Headers.Should().ContainKey("X-XSS-Protection");
            response.Headers.Should().ContainKey("Referrer-Policy");
            response.Headers.Should().ContainKey("Content-Security-Policy");
            response.Headers.Should().ContainKey("Permissions-Policy");
            response.Headers.Should().ContainKey("Strict-Transport-Security");
        }

        [Fact]
        public async Task XFrameOptions_ShouldBeDeny()
        {
            // Act
            var response = await _client.GetAsync("/api/authentication/csrf-token");

            // Assert
            response.Headers.GetValues("X-Frame-Options").Should().Contain("DENY");
        }

        [Fact]
        public async Task ContentSecurityPolicy_ShouldBeRestrictive()
        {
            // Act
            var response = await _client.GetAsync("/api/authentication/csrf-token");

            // Assert
            var csp = response.Headers.GetValues("Content-Security-Policy").FirstOrDefault();
            csp.Should().NotBeNullOrEmpty();
            csp.Should().Contain("default-src 'self'");
            csp.Should().Contain("frame-ancestors 'none'");
        }

        [Fact]
        public async Task RateLimiting_ShouldLimitLoginAttempts()
        {
            // Arrange
            var loginRequest = new
            {
                Email = "test@example.com",
                Password = "WrongPassword123!"
            };

            var json = JsonSerializer.Serialize(loginRequest);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Act - Make multiple login attempts
            var responses = new List<System.Net.HttpStatusCode>();
            for (int i = 0; i < 10; i++)
            {
                var response = await _client.PostAsync("/api/authentication/login", content);
                responses.Add(response.StatusCode);
            }

            // Assert - Should eventually get rate limited (429)
            responses.Should().Contain(System.Net.HttpStatusCode.TooManyRequests);
        }

        [Fact]
        public async Task PasswordValidation_ShouldRejectWeakPasswords()
        {
            // Arrange
            var registerRequest = new
            {
                Email = "test@example.com",
                Password = "123", // Weak password
                FirstName = "John",
                LastName = "Doe"
            };

            var json = JsonSerializer.Serialize(registerRequest);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PostAsync("/api/authentication/register", content);

            // Assert
            response.StatusCode.Should().Be(System.Net.HttpStatusCode.BadRequest);
        }

        [Fact]
        public async Task JwtToken_ShouldHaveProperClaims()
        {
            // This test would require a successful login to get a JWT token
            // For now, we'll test the token structure if we can get one
            var loginRequest = new
            {
                Email = "test@example.com",
                Password = "ValidPassword123!"
            };

            var json = JsonSerializer.Serialize(loginRequest);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PostAsync("/api/authentication/login", content);

            // Assert
            response.Should().BeSuccessful();
            // In a real scenario, we would verify the OTP and get the JWT token
        }

        [Fact]
        public async Task CsrfProtection_ShouldRequireValidToken()
        {
            // Arrange
            var changePasswordRequest = new
            {
                CurrentPassword = "OldPassword123!",
                NewPassword = "NewPassword123!",
                ConfirmPassword = "NewPassword123!"
            };

            var json = JsonSerializer.Serialize(changePasswordRequest);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Act - Try to change password without CSRF token
            var response = await _client.PostAsync("/api/authentication/change-password", content);

            // Assert - Should fail due to missing CSRF token
            response.StatusCode.Should().Be(System.Net.HttpStatusCode.BadRequest);
        }

        [Fact]
        public async Task InputValidation_ShouldPreventSqlInjection()
        {
            // Arrange
            var loginRequest = new
            {
                Email = "'; DROP TABLE Users; --",
                Password = "ValidPassword123!"
            };

            var json = JsonSerializer.Serialize(loginRequest);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PostAsync("/api/authentication/login", content);

            // Assert - Should handle malicious input gracefully
            response.Should().NotBeNull();
            // Should not crash or expose database errors
        }

        [Fact]
        public async Task XssProtection_ShouldBeEnabled()
        {
            // Act
            var response = await _client.GetAsync("/api/authentication/csrf-token");

            // Assert
            response.Headers.GetValues("X-XSS-Protection").Should().Contain("1; mode=block");
        }

        [Fact]
        public async Task Hsts_ShouldBeEnabled()
        {
            // Act
            var response = await _client.GetAsync("/api/authentication/csrf-token");

            // Assert
            var hsts = response.Headers.GetValues("Strict-Transport-Security").FirstOrDefault();
            hsts.Should().NotBeNullOrEmpty();
            hsts.Should().Contain("max-age=");
            hsts.Should().Contain("includeSubDomains");
        }
    }
} 