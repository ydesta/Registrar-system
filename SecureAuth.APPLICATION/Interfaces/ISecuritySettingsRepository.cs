using System.Threading.Tasks;
using SecureAuth.APPLICATION.DTOs.Security;

namespace SecureAuth.APPLICATION.Interfaces
{
    public interface ISecuritySettingsRepository
    {
        Task<SecuritySettingsModel?> GetSettingsAsync(string section);
        Task<bool> UpdateSettingsAsync(SecuritySettingsModel settings);
    }
} 
