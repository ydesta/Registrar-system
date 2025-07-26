using Microsoft.EntityFrameworkCore;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.DOMAIN.Models;
using SecureAuth.INFRASTRUCTURE.Data;

namespace SecureAuth.INFRASTRUCTURE.Services.Repositories
{
    public class SystemMetricsRepository : Repository<SystemMetrics>, ISystemMetricsRepository
    {
        public SystemMetricsRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<SystemMetrics?> GetLatestMetricsAsync()
        {
            return await _context.Set<SystemMetrics>()
                .OrderByDescending(x => x.Timestamp)
                .FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<SystemMetrics>> GetMetricsByDateRangeAsync(DateTime startDate, DateTime endDate)
        {
            return await _context.Set<SystemMetrics>()
                .Where(x => x.Timestamp >= startDate && x.Timestamp <= endDate)
                .OrderBy(x => x.Timestamp)
                .ToListAsync();
        }

        public async Task<IEnumerable<SystemMetrics>> GetMetricsByTypeAsync(string metricType)
        {
            return await _context.Set<SystemMetrics>()
                .Where(x => x.MetricType == metricType)
                .OrderByDescending(x => x.Timestamp)
                .ToListAsync();
        }

        public async Task<double> GetCpuUsageAsync()
        {
            return 25.0; // Simplified implementation
        }

        public async Task<double> GetMemoryUsageAsync()
        {
            return 512.0; // Simplified implementation
        }

        public async Task<double> GetDiskUsageAsync()
        {
            return 50.0; // Simplified implementation
        }

        public async Task<double> GetNetworkLatencyAsync()
        {
            return 50.0; // Simplified implementation - return double instead of int
        }

        public async Task<int> GetActiveSessionsAsync()
        {
            return 10; // Simplified implementation
        }

        public async Task<int> GetRequestsPerMinuteAsync()
        {
            return 100; // Simplified implementation
        }
    }
} 