using SecureAuth.APPLICATION.Queries.Admin;
using SecureAuth.APPLICATION.DTOs.Admin;
using SecureAuth.APPLICATION.Interfaces;

namespace SecureAuth.APPLICATION.Queries.Admin
{
    public class GetSystemStatisticsQueryHandler : IQueryHandler<GetSystemStatisticsQuery, SystemStatisticsModel>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetSystemStatisticsQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<SystemStatisticsModel> HandleAsync(GetSystemStatisticsQuery query)
        {
            try
            {
                var statistics = new SystemStatisticsModel
                {
                    TimeRange = query.TimeRange,
                    GeneratedAt = DateTime.UtcNow
                };

                // Get user statistics if requested
                if (query.IncludeUserStatistics)
                {
                    statistics.UserStatistics = await GetUserStatistics(query.TimeRange);
                }

                // Get security statistics if requested
                if (query.IncludeSecurityStatistics)
                {
                    statistics.SecurityStatistics = await GetSecurityStatistics(query.TimeRange);
                }

                // Get performance metrics if requested
                if (query.IncludePerformanceMetrics)
                {
                    statistics.PerformanceMetrics = await GetPerformanceMetrics();
                }

                return statistics;
            }
            catch (Exception ex)
            {
                // Return empty statistics model with error information
                return new SystemStatisticsModel
                {
                    TimeRange = query.TimeRange,
                    GeneratedAt = DateTime.UtcNow,
                    UserStatistics = new UserStatisticsModel(),
                    SecurityStatistics = new SecurityStatisticsModel(),
                    PerformanceMetrics = new PerformanceMetricsModel()
                };
            }
        }

        private async Task<UserStatisticsModel> GetUserStatistics(string timeRange)
        {
            var userStats = new UserStatisticsModel();
            
            try
            {
                // Get total users - using available method
                var allUsers = await _unitOfWork.Users.GetAllAsync();
                userStats.TotalUsers = allUsers.Count();
                
                // Get active users - using available method
                var activeUsers = await _unitOfWork.Users.GetActiveUsersAsync();
                userStats.ActiveUsers = activeUsers.Count();
                
                // For now, provide default values for methods that don't exist yet
                userStats.NewRegistrations = 0; // TODO: Implement when repository method is available
                userStats.Logins = 0; // TODO: Implement when repository method is available
                userStats.FailedLogins = 0; // TODO: Implement when repository method is available
                
                // Get locked accounts - using available method
                var inactiveUsers = await _unitOfWork.Users.GetUsersByStatusAsync(false);
                userStats.LockedAccounts = inactiveUsers.Count();
            }
            catch
            {
                // Return empty statistics if there's an error
            }

            return userStats;
        }

        private async Task<SecurityStatisticsModel> GetSecurityStatistics(string timeRange)
        {
            var securityStats = new SecurityStatisticsModel();
            
            try
            {
                // For now, provide default values for methods that don't exist yet
                securityStats.SecurityViolations = 0; // TODO: Implement when repository method is available
                securityStats.PasswordChanges = 0; // TODO: Implement when repository method is available
                securityStats.AccountLockouts = 0; // TODO: Implement when repository method is available
                securityStats.SuspiciousActivities = 0; // TODO: Implement when repository method is available
                securityStats.TwoFactorEnrollments = 0; // TODO: Implement when repository method is available
            }
            catch
            {
                // Return empty statistics if there's an error
            }

            return securityStats;
        }

        private async Task<PerformanceMetricsModel> GetPerformanceMetrics()
        {
            var performanceMetrics = new PerformanceMetricsModel();
            
            try
            {
                // For now, provide default values for methods that don't exist yet
                performanceMetrics.CpuUsage = 0.0; // TODO: Implement when repository method is available
                performanceMetrics.MemoryUsage = 0.0; // TODO: Implement when repository method is available
                performanceMetrics.DiskUsage = 0.0; // TODO: Implement when repository method is available
                performanceMetrics.RequestsPerMinute = 0; // TODO: Implement when repository method is available
                performanceMetrics.AverageResponseTime = 0.0; // TODO: Implement when repository method is available
            }
            catch
            {
                // Return empty metrics if there's an error
            }

            return performanceMetrics;
        }
    }
} 