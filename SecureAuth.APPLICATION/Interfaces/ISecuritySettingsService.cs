namespace SecureAuth.APPLICATION.Interfaces
{
    public interface ISecuritySettingsService
    {
        Task<Dictionary<string, string>> GetAllSecuritySettingsAsync();
        Task<string?> GetSecuritySettingAsync(string key);
        Task<bool> SetSecuritySettingAsync(string key, string value, string description = "");
        Task<bool> UpdateSecuritySettingAsync(string key, string value, string description = "");
        Task<bool> DeleteSecuritySettingAsync(string key);
        Task<bool> InitializeDefaultSecuritySettingsAsync();
        Task<Dictionary<string, object>> GetSecuritySettingsSummaryAsync();
    }
} 