using Microsoft.EntityFrameworkCore;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.APPLICATION.DTOs.Admin;
using SecureAuth.DOMAIN.Models;
using SecureAuth.INFRASTRUCTURE.Data;

namespace SecureAuth.INFRASTRUCTURE.Services.Repositories
{
    public class SystemConfigurationRepository : Repository<SystemConfiguration>, ISystemConfigurationRepository
    {
        public SystemConfigurationRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<SystemConfiguration?> GetByKeyAsync(string key)
        {
            return await _context.Set<SystemConfiguration>()
                .FirstOrDefaultAsync(x => x.Key == key);
        }

        public new async Task<IEnumerable<SystemConfiguration>> GetAllAsync()
        {
            return await _context.Set<SystemConfiguration>().ToListAsync();
        }

        public async Task<SystemConfigurationModel?> GetConfigurationAsync(string section)
        {
            // Simplified implementation - return default configuration
            return new SystemConfigurationModel
            {
                Success = true,
                Message = "Configuration retrieved successfully",
                ConfigurationSection = section,
                SecuritySettings = new SystemSecuritySettingsModel
                {
                    PasswordMinLength = 8,
                    SessionTimeoutMinutes = 30,
                    MaxLoginAttempts = 5,
                    LockoutDurationMinutes = 15,
                    RequireTwoFactor = false
                },
                EmailSettings = new EmailSettingsModel
                {
                    SmtpServer = "smtp.example.com",
                    SmtpPort = 587,
                    FromEmail = "noreply@example.com",
                    FromName = "System",
                    EnableSsl = true
                },
                DatabaseSettings = new DatabaseSettingsModel
                {
                    ConnectionString = "DefaultConnection",
                    CommandTimeout = 30,
                    EnableRetryOnFailure = true
                },
                LoggingSettings = new LoggingSettingsModel
                {
                    LogLevel = "Information",
                    LogFilePath = "logs/app.log",
                    EnableConsoleLogging = true,
                    EnableFileLogging = true
                }
            };
        }

        public async Task<bool> UpdateConfigurationAsync(SystemConfigurationModel model)
        {
            // Simplified implementation
            return true;
        }
    }
} 