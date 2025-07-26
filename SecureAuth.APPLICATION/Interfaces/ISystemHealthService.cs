namespace SecureAuth.APPLICATION.Interfaces
{
    public interface ISystemHealthService
    {
        Task RecordDatabaseHealthAsync();
        Task RecordServiceHealthAsync(string serviceName, string status, int responseTime, string? errorMessage = null);
        Task RecordSystemMetricsAsync(string metricType, double value, string? unit = null, string? description = null);
        Task<bool> CheckDatabaseHealthAsync();
        Task<bool> CheckServiceHealthAsync(string serviceName);
        Task<Dictionary<string, object>> GetSystemHealthSummaryAsync();
    }
} 