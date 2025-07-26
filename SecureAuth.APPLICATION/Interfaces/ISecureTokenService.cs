using System.Security.Claims;
using System.Threading.Tasks;
using SecureAuth.DOMAIN.Interfaces;

namespace SecureAuth.APPLICATION.Interfaces
{
    public interface ISecureTokenService
    {
        string GenerateAccessToken(IUserIdentity user);
        Task<string> GenerateAccessTokenAsync(IUserIdentity user);
        string GenerateRefreshToken();
        ClaimsPrincipal GetPrincipalFromToken(string token);
        Task<bool> ValidateRefreshToken(string userId, string refreshToken);
        Task RevokeRefreshToken(string userId, string refreshToken);
        Task RevokeAllRefreshTokens(string userId);
        
        // Additional methods for CQRS handlers
        Task<string> GenerateJwtTokenAsync(IUserIdentity user);
        Task<string> GenerateRefreshTokenAsync();
        
        // Session management methods
        Task<string> ExtendSessionAsync(string userId);
        Task<object> GetSessionInfoAsync(string userId);
    }
} 
