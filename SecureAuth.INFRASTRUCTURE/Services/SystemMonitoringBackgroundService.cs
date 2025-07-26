using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SecureAuth.APPLICATION.Interfaces;
using System.Diagnostics;

namespace SecureAuth.INFRASTRUCTURE.Services
{
    public class SystemMonitoringBackgroundService : BackgroundService
    {
        private readonly ILogger<SystemMonitoringBackgroundService> _logger;
        private readonly IServiceProvider _serviceProvider;
        private readonly TimeSpan _monitoringInterval = TimeSpan.FromMinutes(5);

        public SystemMonitoringBackgroundService(
            ILogger<SystemMonitoringBackgroundService> logger,
            IServiceProvider serviceProvider)
        {
            _logger = logger;
            _serviceProvider = serviceProvider;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("System monitoring background service started");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await PerformSystemMonitoringAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error during system monitoring");
                }

                await Task.Delay(_monitoringInterval, stoppingToken);
            }

            _logger.LogInformation("System monitoring background service stopped");
        }

        private async Task PerformSystemMonitoringAsync()
        {
            using var scope = _serviceProvider.CreateScope();
            var systemHealthService = scope.ServiceProvider.GetRequiredService<ISystemHealthService>();

            _logger.LogDebug("Starting system monitoring cycle");

            // Record database health
            await systemHealthService.RecordDatabaseHealthAsync();

            // Record service health for key services
            await RecordServiceHealthAsync(systemHealthService, "AuthenticationService");
            await RecordServiceHealthAsync(systemHealthService, "UserManagementService");
            await RecordServiceHealthAsync(systemHealthService, "EmailService");

            // Record system metrics
            await RecordSystemMetricsAsync(systemHealthService);

            _logger.LogDebug("System monitoring cycle completed");
        }

        private async Task RecordServiceHealthAsync(ISystemHealthService systemHealthService, string serviceName)
        {
            try
            {
                var stopwatch = Stopwatch.StartNew();
                var isHealthy = await systemHealthService.CheckServiceHealthAsync(serviceName);
                stopwatch.Stop();

                var status = isHealthy ? "Healthy" : "Unhealthy";
                await systemHealthService.RecordServiceHealthAsync(serviceName, status, (int)stopwatch.ElapsedMilliseconds);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error recording health for service {ServiceName}", serviceName);
                await systemHealthService.RecordServiceHealthAsync(serviceName, "Error", 0, ex.Message);
            }
        }

        private async Task RecordSystemMetricsAsync(ISystemHealthService systemHealthService)
        {
            try
            {
                // Record memory usage
                var memoryInfo = GC.GetGCMemoryInfo();
                var memoryUsageMB = memoryInfo.HeapSizeBytes / (1024 * 1024);
                await systemHealthService.RecordSystemMetricsAsync("MemoryUsage", memoryUsageMB, "MB", "Current heap memory usage");

                // Record CPU usage (simplified)
                var cpuUsage = GetCpuUsage();
                await systemHealthService.RecordSystemMetricsAsync("CpuUsage", cpuUsage, "%", "CPU usage percentage");

                // Record active threads
                var threadCount = Process.GetCurrentProcess().Threads.Count;
                await systemHealthService.RecordSystemMetricsAsync("ActiveThreads", threadCount, "count", "Number of active threads");

                // Record uptime
                var uptime = (DateTime.UtcNow - Process.GetCurrentProcess().StartTime.ToUniversalTime()).TotalHours;
                await systemHealthService.RecordSystemMetricsAsync("Uptime", uptime, "hours", "Application uptime");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error recording system metrics");
            }
        }

        private double GetCpuUsage()
        {
            try
            {
                // This is a simplified CPU usage calculation
                // In a production environment, you might use PerformanceCounters or other monitoring tools
                var process = Process.GetCurrentProcess();
                var startTime = process.StartTime;
                var startCpu = process.TotalProcessorTime;

                Thread.Sleep(100); // Wait a bit to get a meaningful measurement

                process.Refresh();
                var endTime = process.StartTime;
                var endCpu = process.TotalProcessorTime;

                var cpuUsedMs = (endCpu - startCpu).TotalMilliseconds;
                var totalMsPassed = (endTime - startTime).TotalMilliseconds;
                var cpuUsageTotal = cpuUsedMs / (Environment.ProcessorCount * totalMsPassed);

                return Math.Round(cpuUsageTotal * 100, 2);
            }
            catch
            {
                return 0.0; // Return 0 if we can't measure CPU usage
            }
        }
    }
} 