using Microsoft.Extensions.Logging;
using SecureAuth.APPLICATION.DTOs.Security;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.DOMAIN.Models.Security;
using System.Collections.Concurrent;
using Microsoft.Extensions.Options;

namespace SecureAuth.INFRASTRUCTURE.Services
{
    public class RateLimitingService : IRateLimitingService
    {
        private static readonly ConcurrentDictionary<string, RateLimitInfo> _rateLimits = new();
        private readonly ILogger<RateLimitingService> _logger;
        private readonly RateLimitingPolicy _rateLimitingPolicy;
        private readonly Timer _cleanupTimer;
        private static readonly object _cleanupLock = new object();

        public RateLimitingService(
            ILogger<RateLimitingService> logger,
            IOptions<RateLimitingPolicy> rateLimitingPolicy)
        {
            _logger = logger;
            _rateLimitingPolicy = rateLimitingPolicy.Value;
            
            // Setup cleanup timer to run every 5 minutes
            _cleanupTimer = new Timer(CleanupExpiredEntries, null, TimeSpan.FromMinutes(5), TimeSpan.FromMinutes(5));
        }

        public Task<bool> CheckRateLimitAsync(string key, int maxAttempts, int timeWindowMinutes)
        {
            return Task.FromResult(IsRateLimitExceeded(key, maxAttempts, timeWindowMinutes));
        }

        public Task<bool> IsRateLimitExceededAsync(string identifier, int maxRequests, int windowMinutes)
        {
            return Task.FromResult(IsRateLimitExceeded(identifier, maxRequests, windowMinutes));
        }

        private bool IsRateLimitExceeded(string identifier, int maxRequests, int windowMinutes)
        {
            try
            {
                if (!_rateLimits.TryGetValue(identifier, out var rateLimitInfo))
                {
                    return false;
                }

                // Check if the time window has expired
                if (DateTime.UtcNow - rateLimitInfo.FirstAttempt > TimeSpan.FromMinutes(windowMinutes))
                {
                    _rateLimits.TryRemove(identifier, out _);
                    return false;
                }

                // Check if the number of attempts exceeds the limit
                var isLimited = rateLimitInfo.Attempts >= maxRequests;
                if (isLimited)
                {
                    _logger.LogWarning("Rate limit exceeded for key {Key}: {Attempts} attempts in {Minutes} minutes", 
                        identifier, rateLimitInfo.Attempts, windowMinutes);
                }

                return isLimited;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking rate limit for key {Key}", identifier);
                return false; // Fail open in case of errors
            }
        }

        public Task<int> GetRemainingRequestsAsync(string identifier, int maxRequests, int windowMinutes)
        {
            try
            {
                if (!_rateLimits.TryGetValue(identifier, out var rateLimitInfo))
                {
                    return Task.FromResult(maxRequests);
                }

                // Check if the time window has expired
                if (DateTime.UtcNow - rateLimitInfo.FirstAttempt > TimeSpan.FromMinutes(windowMinutes))
                {
                    _rateLimits.TryRemove(identifier, out _);
                    return Task.FromResult(maxRequests);
                }

                return Task.FromResult(Math.Max(0, maxRequests - rateLimitInfo.Attempts));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting remaining requests for key {Key}", identifier);
                return Task.FromResult(maxRequests); // Fail open in case of errors
            }
        }

        public Task<bool> IncrementRequestCountAsync(string identifier)
        {
            try
            {
                var rateLimitInfo = _rateLimits.GetOrAdd(identifier, _ => new RateLimitInfo
                {
                    FirstAttempt = DateTime.UtcNow,
                    Attempts = 0
                });

                rateLimitInfo.Attempts++;
                
                // Only log at debug level to reduce performance impact
                if (_logger.IsEnabled(LogLevel.Debug))
                {
                    _logger.LogDebug("Rate limit incremented for key {Key}: {Attempts} attempts", identifier, rateLimitInfo.Attempts);
                }

                return Task.FromResult(true);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error incrementing rate limit for key {Key}", identifier);
                return Task.FromResult(false);
            }
        }

        public Task<bool> ResetRateLimitAsync(string identifier)
        {
            try
            {
                _rateLimits.TryRemove(identifier, out _);
                
                if (_logger.IsEnabled(LogLevel.Debug))
                {
                    _logger.LogDebug("Rate limit reset for key {Key}", identifier);
                }
                
                return Task.FromResult(true);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resetting rate limit for key {Key}", identifier);
                return Task.FromResult(false);
            }
        }

        public Task IncrementAttemptsAsync(string key)
        {
            return IncrementRequestCountAsync(key);
        }

        public Task ResetAttemptsAsync(string key)
        {
            return ResetRateLimitAsync(key);
        }

        private void CleanupExpiredEntries(object state)
        {
            try
            {
                lock (_cleanupLock)
                {
                    var now = DateTime.UtcNow;
                    var keysToRemove = new List<string>();

                    foreach (var kvp in _rateLimits)
                    {
                        // Remove entries older than 1 hour (most rate limits are shorter)
                        if (now - kvp.Value.FirstAttempt > TimeSpan.FromHours(1))
                        {
                            keysToRemove.Add(kvp.Key);
                        }
                    }

                    foreach (var key in keysToRemove)
                    {
                        _rateLimits.TryRemove(key, out _);
                    }

                    if (keysToRemove.Count > 0)
                    {
                        _logger.LogInformation("Cleaned up {Count} expired rate limit entries", keysToRemove.Count);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during rate limit cleanup");
            }
        }

        public void Dispose()
        {
            _cleanupTimer?.Dispose();
        }

        private class RateLimitInfo
        {
            public DateTime FirstAttempt { get; set; }
            public int Attempts { get; set; }
        }
    }
} 