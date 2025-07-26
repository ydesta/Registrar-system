using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.INFRASTRUCTURE.Data;
using SecureAuth.DOMAIN.Models;
using SecureAuth.DOMAIN.Models.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using SecureAuth.DOMAIN.Interfaces;

namespace SecureAuth.INFRASTRUCTURE.Services.Security
{
    public class SecureTokenService : ISecureTokenService
    {
        private readonly ApplicationDbContext _context;
        private readonly TokenPolicy _tokenPolicy;
        private readonly IConfiguration _configuration;

        public SecureTokenService(
            ApplicationDbContext context,
            IOptions<TokenPolicy> tokenPolicy,
            IConfiguration configuration)
        {
            _context = context;
            _tokenPolicy = tokenPolicy.Value;
            _configuration = configuration;
        }

        public async Task<string> GenerateAccessTokenAsync(IUserIdentity user)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Email, user.Email ?? string.Empty),
                new Claim(ClaimTypes.Name, user.UserName ?? string.Empty),
                new Claim("jti", Guid.NewGuid().ToString()),
                new Claim("iat", DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64),
                new Claim("sub", user.Id),
                new Claim("aud", _configuration["JWT:ValidAudience"] ?? string.Empty),
                new Claim("iss", _configuration["JWT:ValidIssuer"] ?? string.Empty)
            };

            // Get user roles and add them to claims
            var userRoles = await _context.UserRoles
                .Where(ur => ur.UserId == user.Id)
                .Join(_context.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => r.Name)
                .ToListAsync();

            foreach (var role in userRoles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JWT:Secret"] ?? string.Empty));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);

            var token = new JwtSecurityToken(
                issuer: _configuration["JWT:ValidIssuer"],
                audience: _configuration["JWT:ValidAudience"],
                claims: claims,
                notBefore: DateTime.UtcNow,
                expires: DateTime.UtcNow.AddMinutes(_tokenPolicy.AccessTokenValidity),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public string GenerateAccessToken(IUserIdentity user)
        {
            // For backward compatibility, call the async version
            return GenerateAccessTokenAsync(user).GetAwaiter().GetResult();
        }

        public string GenerateRefreshToken()
        {
            var randomNumber = new byte[32];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            return Convert.ToBase64String(randomNumber);
        }

        public ClaimsPrincipal GetPrincipalFromToken(string token)
        {
            var tokenValidationParameters = new TokenValidationParameters
            {
                ValidateAudience = true,
                ValidateIssuer = true,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JWT:Secret"] ?? string.Empty)),
                ValidateLifetime = false,
                ValidIssuer = _configuration["JWT:ValidIssuer"],
                ValidAudience = _configuration["JWT:ValidAudience"]
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out var securityToken);

            if (!(securityToken is JwtSecurityToken jwtSecurityToken) ||
                !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha512Signature, StringComparison.InvariantCultureIgnoreCase))
            {
                throw new SecurityTokenException("Invalid token");
            }

            return principal;
        }

        public async Task<bool> ValidateRefreshToken(string userId, string refreshToken)
        {
            var storedToken = await _context.RefreshTokens
                .FirstOrDefaultAsync(rt => rt.UserId == userId && rt.Token == refreshToken);

            if (storedToken == null || storedToken.ExpiresAt < DateTime.UtcNow || storedToken.IsRevoked)
                return false;

            return true;
        }

        public async Task RevokeRefreshToken(string userId, string refreshToken)
        {
            var storedToken = await _context.RefreshTokens
                .FirstOrDefaultAsync(rt => rt.UserId == userId && rt.Token == refreshToken);

            if (storedToken != null)
            {
                storedToken.RevokedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        public async Task RevokeAllRefreshTokens(string userId)
        {
            var tokens = await _context.RefreshTokens
                .Where(rt => rt.UserId == userId && !rt.IsRevoked)
                .ToListAsync();

            foreach (var token in tokens)
            {
                token.RevokedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
        }

        public Task<string> GenerateJwtTokenAsync(IUserIdentity user)
        {
            return Task.FromResult(GenerateAccessToken(user));
        }

        public Task<string> GenerateRefreshTokenAsync()
        {
            return Task.FromResult(GenerateRefreshToken());
        }

        public async Task<string> ExtendSessionAsync(string userId)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    return string.Empty;
                }

                // Generate a new access token with extended validity
                var newToken = await GenerateAccessTokenAsync(user);

                // Update the user's refresh token expiry
                user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(_tokenPolicy.RefreshTokenValidity);
                await _context.SaveChangesAsync();

                // Log the session extension
                await LogSessionActivity(userId, "Session Extended", "User session was extended");

                return newToken;
            }
            catch (Exception)
            {
                return string.Empty;
            }
        }

        public async Task<object> GetSessionInfoAsync(string userId)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    return new { error = "User not found" };
                }

                var sessionInfo = new
                {
                    userId = user.Id,
                    email = user.Email,
                    userName = user.UserName,
                    refreshTokenExpiry = user.RefreshTokenExpiry,
                    lastLoginTime = user.LastLoginAt,
                    isActive = user.RefreshTokenExpiry > DateTime.UtcNow,
                    timeRemaining = user.RefreshTokenExpiry > DateTime.UtcNow 
                        ? (user.RefreshTokenExpiry.Value - DateTime.UtcNow).TotalMinutes 
                        : 0
                };

                return sessionInfo;
            }
            catch (Exception ex)
            {
                return new { error = ex.Message };
            }
        }

        private async Task LogSessionActivity(string userId, string action, string description)
        {
            try
            {
                var activityLog = new ActivityLog
                {
                    Id = Guid.NewGuid().ToString(),
                    UserId = userId,
                    Action = action,
                    EntityType = "Session",
                    EntityId = userId,
                    Details = description,
                    IpAddress = "System", // Could be enhanced to get actual IP
                    UserAgent = "System",
                    Timestamp = DateTime.UtcNow,
                    Status = true
                };

                _context.ActivityLogs.Add(activityLog);
                await _context.SaveChangesAsync();
            }
            catch (Exception)
            {
                // Log silently - session extension shouldn't fail due to logging issues
            }
        }
    }
} 
