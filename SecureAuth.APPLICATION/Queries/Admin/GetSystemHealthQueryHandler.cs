using SecureAuth.APPLICATION.Queries.Admin;
using SecureAuth.APPLICATION.DTOs.Admin;
using SecureAuth.APPLICATION.Interfaces;

namespace SecureAuth.APPLICATION.Queries.Admin
{
    public class GetSystemHealthQueryHandler : IQueryHandler<GetSystemHealthQuery, SystemHealthModel>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetSystemHealthQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<SystemHealthModel> HandleAsync(GetSystemHealthQuery query)
        {
            try
            {
                var healthModel = new SystemHealthModel
                {
                    CheckedAt = DateTime.UtcNow,
                    OverallStatus = "Healthy"
                };

                // Check database health
                if (query.IncludeDatabaseHealth)
                {
                    healthModel.DatabaseHealth = await CheckDatabaseHealth();
                }

                // Check service health
                if (query.IncludeServiceHealth)
                {
                    healthModel.ServiceHealth = await CheckServiceHealth();
                }

                // Get detailed metrics if requested
                if (query.IncludeDetailedMetrics)
                {
                    healthModel.DetailedMetrics = await GetDetailedMetrics();
                }

                // Determine overall status
                healthModel.OverallStatus = DetermineOverallStatus(healthModel);

                healthModel.Success = true;
                healthModel.Message = "System health check completed";
                return healthModel;
            }
            catch (Exception ex)
            {
                return new SystemHealthModel 
                { 
                    Success = false, 
                    Message = $"Error checking system health: {ex.Message}",
                    OverallStatus = "Error"
                };
            }
        }

        private async Task<DatabaseHealthModel> CheckDatabaseHealth()
        {
            var dbHealth = new DatabaseHealthModel();
            
            try
            {
                // Check database connectivity
                dbHealth.IsConnected = await _unitOfWork.DatabaseHealth.CheckConnectionAsync();
                
                if (dbHealth.IsConnected)
                {
                    // Check database performance
                    dbHealth.ResponseTime = await _unitOfWork.DatabaseHealth.GetResponseTimeAsync();
                    dbHealth.ActiveConnections = await _unitOfWork.DatabaseHealth.GetActiveConnectionsAsync();
                    dbHealth.Status = dbHealth.ResponseTime < 1000 ? "Healthy" : "Degraded";
                }
                else
                {
                    dbHealth.Status = "Unhealthy";
                }
            }
            catch
            {
                dbHealth.Status = "Error";
                dbHealth.IsConnected = false;
            }

            return dbHealth;
        }

        private async Task<ServiceHealthModel> CheckServiceHealth()
        {
            var serviceHealth = new ServiceHealthModel();
            
            try
            {
                // Check various services
                serviceHealth.AuthenticationService = await _unitOfWork.ServiceHealth.CheckAuthenticationServiceAsync();
                serviceHealth.EmailService = await _unitOfWork.ServiceHealth.CheckEmailServiceAsync();
                serviceHealth.NotificationService = await _unitOfWork.ServiceHealth.CheckNotificationServiceAsync();
                
                // Determine overall service status
                var allServices = new[] 
                { 
                    serviceHealth.AuthenticationService, 
                    serviceHealth.EmailService, 
                    serviceHealth.NotificationService 
                };
                
                serviceHealth.Status = allServices.All(s => s == "Healthy") ? "Healthy" : "Degraded";
            }
            catch
            {
                serviceHealth.Status = "Error";
            }

            return serviceHealth;
        }

        private async Task<DetailedMetricsModel> GetDetailedMetrics()
        {
            return new DetailedMetricsModel
            {
                CpuUsage = await _unitOfWork.SystemMetrics.GetCpuUsageAsync(),
                MemoryUsage = await _unitOfWork.SystemMetrics.GetMemoryUsageAsync(),
                DiskUsage = await _unitOfWork.SystemMetrics.GetDiskUsageAsync(),
                NetworkLatency = await _unitOfWork.SystemMetrics.GetNetworkLatencyAsync(),
                ActiveSessions = await _unitOfWork.SystemMetrics.GetActiveSessionsAsync(),
                RequestsPerMinute = await _unitOfWork.SystemMetrics.GetRequestsPerMinuteAsync()
            };
        }

        private string DetermineOverallStatus(SystemHealthModel health)
        {
            if (health.DatabaseHealth?.Status == "Unhealthy" || 
                health.ServiceHealth?.Status == "Unhealthy")
            {
                return "Unhealthy";
            }
            
            if (health.DatabaseHealth?.Status == "Degraded" || 
                health.ServiceHealth?.Status == "Degraded")
            {
                return "Degraded";
            }
            
            return "Healthy";
        }
    }
} 
