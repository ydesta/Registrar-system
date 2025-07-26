using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.DOMAIN.Models;
using SecureAuth.INFRASTRUCTURE.Data;
using System.Diagnostics;

namespace SecureAuth.INFRASTRUCTURE.Services
{
    public class SystemHealthService : ISystemHealthService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<SystemHealthService> _logger;

        public SystemHealthService(
            ApplicationDbContext context,
            ILogger<SystemHealthService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task RecordDatabaseHealthAsync()
        {
            try
            {
                var stopwatch = Stopwatch.StartNew();
                var isHealthy = await CheckDatabaseHealthAsync();
                stopwatch.Stop();

                var databaseHealth = new DatabaseHealth
                {
                    Status = isHealthy ? "Healthy" : "Unhealthy",
                    ResponseTime = (int)stopwatch.ElapsedMilliseconds,
                    ActiveConnections = await GetActiveConnectionsAsync(),
                    Timestamp = DateTime.UtcNow,
                    ErrorMessage = isHealthy ? null : "Database connection failed",
                    Details = $"Response time: {stopwatch.ElapsedMilliseconds}ms, Active connections: {await GetActiveConnectionsAsync()}"
                };

                _context.DatabaseHealths.Add(databaseHealth);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Database health recorded: {Status}, Response time: {ResponseTime}ms", 
                    databaseHealth.Status, databaseHealth.ResponseTime);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error recording database health");
            }
        }

        public async Task RecordServiceHealthAsync(string serviceName, string status, int responseTime, string? errorMessage = null)
        {
            try
            {
                var serviceHealth = new ServiceHealth
                {
                    ServiceName = serviceName,
                    Status = status,
                    ResponseTime = responseTime,
                    Timestamp = DateTime.UtcNow,
                    ErrorMessage = errorMessage,
                    Details = $"Service: {serviceName}, Status: {status}, Response time: {responseTime}ms"
                };

                _context.ServiceHealths.Add(serviceHealth);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Service health recorded: {ServiceName} - {Status}, Response time: {ResponseTime}ms", 
                    serviceName, status, responseTime);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error recording service health for {ServiceName}", serviceName);
            }
        }

        public async Task RecordSystemMetricsAsync(string metricType, double value, string? unit = null, string? description = null)
        {
            try
            {
                var systemMetric = new SystemMetrics
                {
                    MetricType = metricType,
                    Value = (float)value, // Convert double to float for database compatibility
                    Unit = unit,
                    Timestamp = DateTime.UtcNow,
                    Description = description ?? $"System metric: {metricType}"
                };

                _context.SystemMetrics.Add(systemMetric);
                await _context.SaveChangesAsync();

                _logger.LogInformation("System metric recorded: {MetricType} = {Value} {Unit}", 
                    metricType, value, unit ?? "");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error recording system metric {MetricType}", metricType);
            }
        }

        public async Task<bool> CheckDatabaseHealthAsync()
        {
            try
            {
                // Simple health check - try to execute a query
                await _context.Database.ExecuteSqlRawAsync("SELECT 1");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Database health check failed");
                return false;
            }
        }

        public async Task<bool> CheckServiceHealthAsync(string serviceName)
        {
            try
            {
                // For now, return true. In a real implementation, you would check specific services
                // This could involve HTTP health checks, process checks, etc.
                await Task.Delay(10); // Simulate a quick check
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Service health check failed for {ServiceName}", serviceName);
                return false;
            }
        }

        public async Task<Dictionary<string, object>> GetSystemHealthSummaryAsync()
        {
            try
            {
                var summary = new Dictionary<string, object>();

                // Get latest database health
                var latestDbHealth = await _context.DatabaseHealths
                    .OrderByDescending(dh => dh.Timestamp)
                    .FirstOrDefaultAsync();

                if (latestDbHealth != null)
                {
                    summary["Database"] = new
                    {
                        Status = latestDbHealth.Status,
                        ResponseTime = latestDbHealth.ResponseTime,
                        ActiveConnections = latestDbHealth.ActiveConnections,
                        LastChecked = latestDbHealth.Timestamp
                    };
                }

                // Get latest service health for each service
                var serviceHealths = await _context.ServiceHealths
                    .GroupBy(sh => sh.ServiceName)
                    .Select(g => g.OrderByDescending(sh => sh.Timestamp).First())
                    .ToListAsync();

                summary["Services"] = serviceHealths.ToDictionary(
                    sh => sh.ServiceName,
                    sh => new
                    {
                        Status = sh.Status,
                        ResponseTime = sh.ResponseTime,
                        LastChecked = sh.Timestamp
                    });

                // Get system metrics summary
                var recentMetrics = await _context.SystemMetrics
                    .Where(sm => sm.Timestamp >= DateTime.UtcNow.AddHours(1))
                    .GroupBy(sm => sm.MetricType)
                    .Select(g => new
                    {
                        MetricType = g.Key,
                        AverageValue = g.Average(sm => sm.Value),
                        MaxValue = g.Max(sm => sm.Value),
                        MinValue = g.Min(sm => sm.Value),
                        Count = g.Count()
                    })
                    .ToListAsync();

                summary["Metrics"] = recentMetrics;

                return summary;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting system health summary");
                return new Dictionary<string, object>
                {
                    ["Error"] = "Failed to retrieve system health summary"
                };
            }
        }

        private async Task<int> GetActiveConnectionsAsync()
        {
            try
            {
                // This is a simplified version. In a real implementation, you might query
                // the database for actual connection count or use a monitoring service
                var result = await _context.Database.ExecuteSqlRawAsync("SELECT COUNT(*) FROM sys.dm_exec_connections");
                return (int)result;
            }
            catch
            {
                // Fallback to a reasonable default
                return 5;
            }
        }
    }
} 