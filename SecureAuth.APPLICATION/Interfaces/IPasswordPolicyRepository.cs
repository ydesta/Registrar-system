namespace SecureAuth.APPLICATION.Interfaces
{
    public interface IPasswordPolicyRepository
    {
        Task<DTOs.Security.PasswordPolicyModel?> GetCurrentPolicyAsync();
        Task<List<string>> GetPolicyHistoryAsync();
        Task<bool> UpdatePolicyAsync(DTOs.Security.PasswordPolicyModel policy);
    }
} 
