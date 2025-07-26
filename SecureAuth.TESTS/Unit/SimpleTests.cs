using FluentAssertions;
using SecureAuth.APPLICATION.DTOs.Admin;
using SecureAuth.DOMAIN.Models;
using Xunit;

namespace SecureAuth.TESTS.Unit
{
    public class SimpleTests
    {
        [Fact]
        public void ApiResponse_ShouldWorkCorrectly()
        {
            // Arrange
            var message = "Test message";
            var data = new { id = 1, name = "test" };

            // Act
            var response = new ApiResponse<object>
            {
                IsSuccess = true,
                Message = message,
                Response = data
            };

            // Assert
            response.Should().NotBeNull();
            response.IsSuccess.Should().BeTrue();
            response.Message.Should().Be(message);
            response.Response.Should().Be(data);
        }

        [Fact]
        public void BasicMath_ShouldWork()
        {
            // Arrange
            int a = 2;
            int b = 3;

            // Act
            int result = a + b;

            // Assert
            result.Should().Be(5);
        }

        [Theory]
        [InlineData(1, 2, 3)]
        [InlineData(5, 5, 10)]
        [InlineData(-1, 1, 0)]
        public void Addition_ShouldWorkCorrectly(int a, int b, int expected)
        {
            // Act
            int result = a + b;

            // Assert
            result.Should().Be(expected);
        }
    }
} 