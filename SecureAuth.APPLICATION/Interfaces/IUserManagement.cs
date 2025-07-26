using SecureAuth.DOMAIN.Models;
using System.Threading.Tasks;

namespace SecureAuth.APPLICATION.Interfaces
{
    public interface IUserManagement
    {
        Task<bool> CreateUserAsync(ApplicationUser user, string password);
        Task<bool> UpdateUserAsync(ApplicationUser user);
        Task<bool> DeleteUserAsync(string userId);
        Task<ApplicationUser?> GetUserByIdAsync(string userId);
        Task<ApplicationUser?> GetUserByEmailAsync(string email);
        Task<bool> IsEmailConfirmedAsync(string email);
        Task<string> GenerateEmailConfirmationTokenAsync(ApplicationUser user);
        Task<bool> ConfirmEmailAsync(ApplicationUser user, string token);
        
        // Additional method for CQRS handlers
        Task<object> GetTwoFactorSetupAsync(string userId);
    }
} 
