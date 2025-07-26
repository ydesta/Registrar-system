using System.Threading.Tasks;

namespace SecureAuth.APPLICATION.Interfaces
{
    public interface ISystemMetricsRepository
    {
        Task<double> GetCpuUsageAsync();
        Task<double> GetMemoryUsageAsync();
        Task<double> GetDiskUsageAsync();
        Task<double> GetNetworkLatencyAsync();
        Task<int> GetActiveSessionsAsync();
        Task<int> GetRequestsPerMinuteAsync();
    }
} 
