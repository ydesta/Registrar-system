using System.Threading.Tasks;

namespace SecureAuth.APPLICATION.Interfaces
{
    public interface IServiceHealthRepository
    {
        Task<string> CheckAuthenticationServiceAsync();
        Task<string> CheckEmailServiceAsync();
        Task<string> CheckNotificationServiceAsync();
    }
} 
