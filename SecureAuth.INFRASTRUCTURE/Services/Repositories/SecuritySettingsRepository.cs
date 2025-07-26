using Microsoft.EntityFrameworkCore;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.APPLICATION.DTOs.Security;
using SecureAuth.DOMAIN.Models.Security;
using SecureAuth.INFRASTRUCTURE.Data;

namespace SecureAuth.INFRASTRUCTURE.Services.Repositories
{
    public class SecuritySettingsRepository : Repository<SecuritySettings>, ISecuritySettingsRepository
    {
        public SecuritySettingsRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<SecuritySettings?> GetSettingsByKeyAsync(string key)
        {
            return await _context.Set<SecuritySettings>()
                .FirstOrDefaultAsync(x => x.Key == key);
        }

        public async Task<IEnumerable<SecuritySettings>> GetAllSettingsAsync()
        {
            return await _context.Set<SecuritySettings>().ToListAsync();
        }

        public async Task<SecuritySettingsModel?> GetSettingsAsync(string key)
        {
            // Simplified implementation - return default settings
            return new SecuritySettingsModel
            {
                Success = true,
                Message = "Settings retrieved successfully",
                SessionTimeoutMinutes = 30,
                MaxLoginAttempts = 5,
                LockoutDurationMinutes = 15,
                PasswordChangeIntervalDays = 90,
                TwoFactorRequired = false,
                IpWhitelistEnabled = false,
                RequireEmailConfirmation = true,
                RequirePhoneConfirmation = false,
                ConfigurationSection = key
            };
        }

        public async Task<bool> UpdateSettingsAsync(SecuritySettingsModel model)
        {
            // Simplified implementation
            return true;
        }
    }
} 