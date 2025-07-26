using System.Collections.Concurrent;
using SecureAuth.APPLICATION.Interfaces;
using Microsoft.Extensions.Logging;

namespace SecureAuth.INFRASTRUCTURE.Services
{
    public class OtpService : IOtpService
    {
        private static readonly ConcurrentDictionary<string, (string Otp, DateTime Expiry, string Purpose)> _otps = new();
        private static readonly TimeSpan OtpLifetime = TimeSpan.FromMinutes(5);
        private static readonly Random _random = new();
        private readonly IEmailService _emailService;
        private readonly ILogger<OtpService> _logger;

        public OtpService(IEmailService emailService, ILogger<OtpService> logger)
        {
            _emailService = emailService;
            _logger = logger;
        }

        public async Task<string> GenerateOtpAsync(string userId)
        {
            var otp = _random.Next(100000, 999999).ToString();
            var expiry = DateTime.UtcNow.Add(OtpLifetime);
            var purpose = "Login"; // Default purpose
            
            _otps[userId] = (otp, expiry, purpose);
            
            _logger.LogInformation("OTP generated for user {UserId}, expires at {Expiry}", userId, expiry);
            
            return otp;
        }

        public async Task<string> GenerateOtpAsync(string userId, string email, string purpose = "Login")
        {
            var otp = _random.Next(100000, 999999).ToString();
            var expiry = DateTime.UtcNow.Add(OtpLifetime);
            
            _otps[userId] = (otp, expiry, purpose);
            
            // Send OTP via email
            try
            {
                await _emailService.SendOtpEmailAsync(email, otp, purpose, expiry);
                _logger.LogInformation("OTP sent to {Email} for user {UserId}, purpose: {Purpose}", email, userId, purpose);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send OTP email to {Email} for user {UserId}", email, userId);
                // Don't throw here, as the OTP is still generated and stored
            }
            
            return otp;
        }

        public Task<bool> ValidateOtpAsync(string userId, string otp)
        {
            if (_otps.TryGetValue(userId, out var entry))
            {
                if (entry.Otp == otp && entry.Expiry > DateTime.UtcNow)
                {
                    _otps.TryRemove(userId, out _); // Remove after successful validation
                    _logger.LogInformation("OTP validated successfully for user {UserId}", userId);
                    return Task.FromResult(true);
                }
            }
            
            _logger.LogWarning("OTP validation failed for user {UserId}", userId);
            return Task.FromResult(false);
        }

        public Task<bool> VerifyOtpAsync(string userId, string otp, string? purpose = null)
        {
            if (_otps.TryGetValue(userId, out var entry))
            {
                if (entry.Otp == otp && entry.Expiry > DateTime.UtcNow)
                {
                    // Check purpose if specified
                    if (string.IsNullOrEmpty(purpose) || entry.Purpose == purpose)
                    {
                        _otps.TryRemove(userId, out _); // Remove after successful verification
                        _logger.LogInformation("OTP verified successfully for user {UserId}, purpose: {Purpose}", userId, purpose);
                        return Task.FromResult(true);
                    }
                }
            }
            
            _logger.LogWarning("OTP verification failed for user {UserId}, purpose: {Purpose}", userId, purpose);
            return Task.FromResult(false);
        }

        public Task<bool> IsOtpExpiredAsync(string userId)
        {
            if (_otps.TryGetValue(userId, out var entry))
            {
                var isExpired = entry.Expiry <= DateTime.UtcNow;
                if (isExpired)
                {
                    _otps.TryRemove(userId, out _); // Clean up expired OTP
                    _logger.LogInformation("Expired OTP cleaned up for user {UserId}", userId);
                }
                return Task.FromResult(isExpired);
            }
            return Task.FromResult(true); // Consider non-existent OTP as expired
        }

        public Task RevokeOtpAsync(string userId)
        {
            var removed = _otps.TryRemove(userId, out _);
            if (removed)
            {
                _logger.LogInformation("OTP revoked for user {UserId}", userId);
            }
            return Task.CompletedTask;
        }

        public Task<bool> InvalidateOtpAsync(string userId)
        {
            var removed = _otps.TryRemove(userId, out _);
            if (removed)
            {
                _logger.LogInformation("OTP invalidated for user {UserId}", userId);
            }
            return Task.FromResult(removed);
        }

        public Task<bool> HasValidOtpAsync(string userId)
        {
            if (_otps.TryGetValue(userId, out var entry))
            {
                return Task.FromResult(entry.Expiry > DateTime.UtcNow);
            }
            return Task.FromResult(false);
        }

        public Task<DateTime?> GetOtpExpiryAsync(string userId)
        {
            if (_otps.TryGetValue(userId, out var entry))
            {
                return Task.FromResult<DateTime?>(entry.Expiry);
            }
            return Task.FromResult<DateTime?>(null);
        }
    }
} 