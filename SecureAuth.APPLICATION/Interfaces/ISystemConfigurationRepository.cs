using SecureAuth.APPLICATION.DTOs.Admin;

namespace SecureAuth.APPLICATION.Interfaces
{
    public interface ISystemConfigurationRepository
    {
        Task<SystemConfigurationModel?> GetConfigurationAsync(string section);
        Task<bool> UpdateConfigurationAsync(SystemConfigurationModel config);
    }
} 
