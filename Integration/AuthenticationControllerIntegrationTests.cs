using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SecureAuth.API;
using SecureAuth.INFRASTRUCTURE.Data;
using SecureAuth.INFRASTRUCTURE.Models;
using FluentAssertions;
using Xunit;
using System.Text.Json;
using System.Text;

namespace SecureAuth.TESTS.Integration
{
    public class AuthenticationControllerIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;
        private readonly HttpClient _client;

        public AuthenticationControllerIntegrationTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    // Replace the real database with in-memory database for testing
                    var descriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));

                    if (descriptor != null)
                    {
                        services.Remove(descriptor);
                    }

                    services.AddDbContext<ApplicationDbContext>(options =>
                    {
                        options.UseInMemoryDatabase("TestDb");
                    });
                });
            });

            _client = _factory.CreateClient();
        }

        [Fact]
        public async Task Login_WithValidCredentials_ShouldReturnSuccessResponse()
        {
            // Arrange
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
            var responseContent = await response.Content.ReadAsStringAsync();
            responseContent.Should().Contain("OTP sent");
        }

        [Fact]
        public async Task Login_WithInvalidCredentials_ShouldReturnUnauthorized()
        {
            // Arrange
            var loginRequest = new
            {
                Email = "nonexistent@example.com",
                Password = "WrongPassword123!"
            };

            var json = JsonSerializer.Serialize(loginRequest);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PostAsync("/api/authentication/login", content);

            // Assert
            response.StatusCode.Should().Be(System.Net.HttpStatusCode.Unauthorized);
        }

        [Fact]
        public async Task Register_WithValidData_ShouldReturnSuccessResponse()
        {
            // Arrange
            var registerRequest = new
            {
                Email = "newuser@example.com",
                Password = "ValidPassword123!",
                FirstName = "John",
                LastName = "Doe"
            };

            var json = JsonSerializer.Serialize(registerRequest);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PostAsync("/api/authentication/register", content);

            // Assert
            response.Should().BeSuccessful();
            var responseContent = await response.Content.ReadAsStringAsync();
            responseContent.Should().Contain("Registration successful");
        }

        [Fact]
        public async Task Register_WithExistingEmail_ShouldReturnBadRequest()
        {
            // Arrange
            var registerRequest = new
            {
                Email = "existing@example.com",
                Password = "ValidPassword123!",
                FirstName = "John",
                LastName = "Doe"
            };

            var json = JsonSerializer.Serialize(registerRequest);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Register first time
            await _client.PostAsync("/api/authentication/register", content);

            // Act - Try to register with same email
            var response = await _client.PostAsync("/api/authentication/register", content);

            // Assert
            response.StatusCode.Should().Be(System.Net.HttpStatusCode.BadRequest);
        }

        [Fact]
        public async Task GetCsrfToken_ShouldReturnValidToken()
        {
            // Act
            var response = await _client.GetAsync("/api/authentication/csrf-token");

            // Assert
            response.Should().BeSuccessful();
            var responseContent = await response.Content.ReadAsStringAsync();
            responseContent.Should().Contain("Token");
            responseContent.Should().Contain("X-CSRF-TOKEN");
        }

        [Fact]
        public async Task ForgotPassword_WithValidEmail_ShouldReturnSuccess()
        {
            // Arrange
            var forgotPasswordRequest = new
            {
                Email = "test@example.com"
            };

            var json = JsonSerializer.Serialize(forgotPasswordRequest);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PostAsync("/api/authentication/forgot-password", content);

            // Assert
            response.Should().BeSuccessful();
        }
    }
} 