using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.DOMAIN.Models.Security;
using SecureAuth.INFRASTRUCTURE.Data;

namespace SecureAuth.INFRASTRUCTURE.Services.Security
{
    public class SecuritySettingsService : ISecuritySettingsService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<SecuritySettingsService> _logger;

        public SecuritySettingsService(
            ApplicationDbContext context,
            ILogger<SecuritySettingsService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<Dictionary<string, string>> GetAllSecuritySettingsAsync()
        {
            try
            {
                var settings = await _context.SecuritySettings
                    .Where(ss => ss.IsActive)
                    .ToDictionaryAsync(ss => ss.Key, ss => ss.Value);

                return settings;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all security settings");
                return new Dictionary<string, string>();
            }
        }

        public async Task<string?> GetSecuritySettingAsync(string key)
        {
            try
            {
                var setting = await _context.SecuritySettings
                    .FirstOrDefaultAsync(ss => ss.Key == key && ss.IsActive);

                return setting?.Value;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving security setting {Key}", key);
                return null;
            }
        }

        public async Task<bool> SetSecuritySettingAsync(string key, string value, string description = "")
        {
            try
            {
                var existingSetting = await _context.SecuritySettings
                    .FirstOrDefaultAsync(ss => ss.Key == key);

                if (existingSetting != null)
                {
                    _logger.LogWarning("Security setting {Key} already exists. Use UpdateSecuritySettingAsync instead.", key);
                    return false;
                }

                var securitySetting = new SecuritySettings
                {
                    Key = key,
                    Value = value,
                    Description = description,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    IsActive = true
                };

                _context.SecuritySettings.Add(securitySetting);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Security setting created: {Key} = {Value}", key, value);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating security setting {Key}", key);
                return false;
            }
        }

        public async Task<bool> UpdateSecuritySettingAsync(string key, string value, string description = "")
        {
            try
            {
                var existingSetting = await _context.SecuritySettings
                    .FirstOrDefaultAsync(ss => ss.Key == key);

                if (existingSetting == null)
                {
                    _logger.LogWarning("Security setting {Key} not found. Use SetSecuritySettingAsync instead.", key);
                    return false;
                }

                existingSetting.Value = value;
                if (!string.IsNullOrEmpty(description))
                {
                    existingSetting.Description = description;
                }
                existingSetting.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Security setting updated: {Key} = {Value}", key, value);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating security setting {Key}", key);
                return false;
            }
        }

        public async Task<bool> DeleteSecuritySettingAsync(string key)
        {
            try
            {
                var existingSetting = await _context.SecuritySettings
                    .FirstOrDefaultAsync(ss => ss.Key == key);

                if (existingSetting == null)
                {
                    _logger.LogWarning("Security setting {Key} not found for deletion.", key);
                    return false;
                }

                existingSetting.IsActive = false;
                existingSetting.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Security setting deleted: {Key}", key);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting security setting {Key}", key);
                return false;
            }
        }

        public async Task<bool> InitializeDefaultSecuritySettingsAsync()
        {
            try
            {
                var defaultSettings = new Dictionary<string, (string Value, string Description)>
                {
                    ["MaxLoginAttempts"] = ("5", "Maximum number of failed login attempts before account lockout"),
                    ["LockoutDurationMinutes"] = ("15", "Duration of account lockout in minutes"),
                    ["SessionTimeoutMinutes"] = ("30", "Session timeout in minutes"),
                    ["PasswordMinLength"] = ("8", "Minimum password length"),
                    ["PasswordRequireUppercase"] = ("true", "Require uppercase letters in password"),
                    ["PasswordRequireLowercase"] = ("true", "Require lowercase letters in password"),
                    ["PasswordRequireDigit"] = ("true", "Require digits in password"),
                    ["PasswordRequireSpecialChar"] = ("true", "Require special characters in password"),
                    ["PasswordMaxAgeDays"] = ("90", "Maximum password age in days"),
                    ["PasswordHistoryCount"] = ("5", "Number of previous passwords to remember"),
                    ["RequireEmailVerification"] = ("true", "Require email verification for new accounts"),
                    ["RequirePhoneVerification"] = ("false", "Require phone verification for new accounts"),
                    ["EnableTwoFactorAuth"] = ("true", "Enable two-factor authentication"),
                    ["EnableAuditLogging"] = ("true", "Enable audit logging"),
                    ["EnableSecurityEvents"] = ("true", "Enable security event recording"),
                    ["EnableRateLimiting"] = ("true", "Enable rate limiting"),
                    ["RateLimitRequestsPerMinute"] = ("60", "Maximum requests per minute per IP"),
                    ["EnableCSRFProtection"] = ("true", "Enable CSRF protection"),
                    ["EnableXSSProtection"] = ("true", "Enable XSS protection"),
                    ["EnableHSTS"] = ("true", "Enable HTTP Strict Transport Security"),
                    ["JWTExpirationMinutes"] = ("60", "JWT token expiration time in minutes"),
                    ["RefreshTokenExpirationDays"] = ("7", "Refresh token expiration time in days")
                };

                foreach (var (key, (value, description)) in defaultSettings)
                {
                    var existingSetting = await _context.SecuritySettings
                        .FirstOrDefaultAsync(ss => ss.Key == key);

                    if (existingSetting == null)
                    {
                        var securitySetting = new SecuritySettings
                        {
                            Key = key,
                            Value = value,
                            Description = description,
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow,
                            IsActive = true
                        };

                        _context.SecuritySettings.Add(securitySetting);
                    }
                }

                await _context.SaveChangesAsync();
                _logger.LogInformation("Default security settings initialized successfully");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error initializing default security settings");
                return false;
            }
        }

        public async Task<Dictionary<string, object>> GetSecuritySettingsSummaryAsync()
        {
            try
            {
                var settings = await _context.SecuritySettings
                    .Where(ss => ss.IsActive)
                    .ToListAsync();

                var summary = new Dictionary<string, object>
                {
                    ["TotalSettings"] = settings.Count,
                    ["LastUpdated"] = settings.Any() ? settings.Max(s => s.UpdatedAt) : DateTime.UtcNow,
                    ["Categories"] = new
                    {
                        Authentication = settings.Count(s => s.Key.StartsWith("Password") || s.Key.StartsWith("MaxLogin") || s.Key.StartsWith("Lockout")),
                        Session = settings.Count(s => s.Key.StartsWith("Session") || s.Key.StartsWith("JWT") || s.Key.StartsWith("RefreshToken")),
                        Security = settings.Count(s => s.Key.StartsWith("Enable") || s.Key.StartsWith("Require")),
                        RateLimiting = settings.Count(s => s.Key.StartsWith("RateLimit"))
                    },
                    ["Settings"] = settings.ToDictionary(s => s.Key, s => new
                    {
                        Value = s.Value,
                        Description = s.Description,
                        LastUpdated = s.UpdatedAt
                    })
                };

                return summary;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting security settings summary");
                return new Dictionary<string, object>
                {
                    ["Error"] = "Failed to retrieve security settings summary"
                };
            }
        }
    }
} 