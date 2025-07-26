using FluentAssertions;
using Moq;
using SecureAuth.APPLICATION.Services;
using SecureAuth.APPLICATION.Models.Authentication;
using SecureAuth.INFRASTRUCTURE.Models;
using Microsoft.AspNetCore.Identity;
using Xunit;
using SecureAuth.TESTS.Helpers;
using Microsoft.Extensions.Logging;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.DOMAIN.Models;

namespace SecureAuth.TESTS.Unit
{
    public class AuthenticationServiceTests : TestBase<IAuthenticationService>
    {
        private readonly Mock<UserManager<ApplicationUser>> _userManagerMock;
        private readonly Mock<SignInManager<ApplicationUser>> _signInManagerMock;
        private readonly Mock<ISecureTokenService> _tokenServiceMock;
        private readonly Mock<IOtpService> _otpServiceMock;
        private readonly Mock<IEmailSender> _emailSenderMock;

        public AuthenticationServiceTests()
        {
            _userManagerMock = GetMock<UserManager<ApplicationUser>>();
            _signInManagerMock = GetMock<SignInManager<ApplicationUser>>();
            _tokenServiceMock = GetMock<ISecureTokenService>();
            _otpServiceMock = GetMock<IOtpService>();
            _emailSenderMock = GetMock<IEmailSender>();
        }

        protected override IAuthenticationService CreateSystemUnderTest()
        {
            return new AuthenticationService(
                _userManagerMock.Object,
                _signInManagerMock.Object,
                _tokenServiceMock.Object,
                _otpServiceMock.Object,
                _emailSenderMock.Object);
        }

        [Fact]
        public void Login_WithValidCredentials_ShouldReturnSuccessResponse()
        {
            // Arrange
            var loginRequest = new LoginRequest
            {
                Email = "test@example.com",
                Password = "ValidPassword123!"
            };

            var user = new ApplicationUser
            {
                Id = "user-id",
                Email = loginRequest.Email,
                UserName = loginRequest.Email,
                IsActive = true
            };

            _userManagerMock.Setup(x => x.FindByEmailAsync(loginRequest.Email))
                .ReturnsAsync(user);

            _signInManagerMock.Setup(x => x.CheckPasswordSignInAsync(user, loginRequest.Password, false))
                .ReturnsAsync(SignInResult.Success);

            _otpServiceMock.Setup(x => x.GenerateOtpAsync(user.Email))
                .ReturnsAsync("123456");

            // Act
            var result = Sut.LoginAsync(loginRequest).Result;

            // Assert
            result.Should().NotBeNull();
            result.Success.Should().BeTrue();
            result.Message.Should().Contain("OTP sent");
        }

        [Fact]
        public void Login_WithInvalidEmail_ShouldReturnFailureResponse()
        {
            // Arrange
            var loginRequest = new LoginRequest
            {
                Email = "nonexistent@example.com",
                Password = "ValidPassword123!"
            };

            _userManagerMock.Setup(x => x.FindByEmailAsync(loginRequest.Email))
                .ReturnsAsync((ApplicationUser)null);

            // Act
            var result = Sut.LoginAsync(loginRequest).Result;

            // Assert
            result.Should().NotBeNull();
            result.Success.Should().BeFalse();
            result.Message.Should().Contain("Invalid email or password");
        }

        [Fact]
        public void Login_WithInvalidPassword_ShouldReturnFailureResponse()
        {
            // Arrange
            var loginRequest = new LoginRequest
            {
                Email = "test@example.com",
                Password = "WrongPassword123!"
            };

            var user = new ApplicationUser
            {
                Id = "user-id",
                Email = loginRequest.Email,
                UserName = loginRequest.Email,
                IsActive = true
            };

            _userManagerMock.Setup(x => x.FindByEmailAsync(loginRequest.Email))
                .ReturnsAsync(user);

            _signInManagerMock.Setup(x => x.CheckPasswordSignInAsync(user, loginRequest.Password, false))
                .ReturnsAsync(SignInResult.Failed);

            // Act
            var result = Sut.LoginAsync(loginRequest).Result;

            // Assert
            result.Should().NotBeNull();
            result.Success.Should().BeFalse();
            result.Message.Should().Contain("Invalid email or password");
        }

        [Fact]
        public void Login_WithLockedAccount_ShouldReturnFailureResponse()
        {
            // Arrange
            var loginRequest = new LoginRequest
            {
                Email = "test@example.com",
                Password = "ValidPassword123!"
            };

            var user = new ApplicationUser
            {
                Id = "user-id",
                Email = loginRequest.Email,
                UserName = loginRequest.Email,
                IsActive = true,
                LockoutEnd = DateTime.UtcNow.AddMinutes(30)
            };

            _userManagerMock.Setup(x => x.FindByEmailAsync(loginRequest.Email))
                .ReturnsAsync(user);

            // Act
            var result = Sut.LoginAsync(loginRequest).Result;

            // Assert
            result.Should().NotBeNull();
            result.Success.Should().BeFalse();
            result.Message.Should().Contain("Account is locked");
        }

        [Fact]
        public void VerifyOtp_WithValidOtp_ShouldReturnSuccessResponse()
        {
            // Arrange
            var otpRequest = new OtpVerifyRequest
            {
                Email = "test@example.com",
                Otp = "123456"
            };

            var user = new ApplicationUser
            {
                Id = "user-id",
                Email = otpRequest.Email,
                UserName = otpRequest.Email,
                IsActive = true
            };

            _userManagerMock.Setup(x => x.FindByEmailAsync(otpRequest.Email))
                .ReturnsAsync(user);

            _otpServiceMock.Setup(x => x.ValidateOtpAsync(otpRequest.Email, otpRequest.Otp))
                .ReturnsAsync(true);

            _tokenServiceMock.Setup(x => x.GenerateAccessToken(user))
                .Returns("valid-access-token");

            _tokenServiceMock.Setup(x => x.GenerateRefreshToken())
                .Returns("valid-refresh-token");

            // Act
            var result = Sut.VerifyOtpAsync(otpRequest).Result;

            // Assert
            result.Should().NotBeNull();
            result.Success.Should().BeTrue();
            result.AccessToken.Should().NotBeNullOrEmpty();
            result.RefreshToken.Should().NotBeNullOrEmpty();
        }

        [Fact]
        public void VerifyOtp_WithInvalidOtp_ShouldReturnFailureResponse()
        {
            // Arrange
            var otpRequest = new OtpVerifyRequest
            {
                Email = "test@example.com",
                Otp = "000000"
            };

            var user = new ApplicationUser
            {
                Id = "user-id",
                Email = otpRequest.Email,
                UserName = otpRequest.Email,
                IsActive = true
            };

            _userManagerMock.Setup(x => x.FindByEmailAsync(otpRequest.Email))
                .ReturnsAsync(user);

            _otpServiceMock.Setup(x => x.ValidateOtpAsync(otpRequest.Email, otpRequest.Otp))
                .ReturnsAsync(false);

            // Act
            var result = Sut.VerifyOtpAsync(otpRequest).Result;

            // Assert
            result.Should().NotBeNull();
            result.Success.Should().BeFalse();
            result.Message.Should().Contain("Invalid or expired OTP");
        }
    }
} 