using SecureAuth.APPLICATION.DTOs.Admin;

namespace SecureAuth.APPLICATION.Queries.Admin
{
    public class GetSystemStatisticsQuery : IQuery<SystemStatisticsModel>
    {
        public string TimeRange { get; set; } = "Last24Hours"; // "LastHour", "Last24Hours", "Last7Days", "Last30Days", "LastYear"
        public bool IncludeUserStatistics { get; set; } = true;
        public bool IncludeSecurityStatistics { get; set; } = true;
        public bool IncludePerformanceMetrics { get; set; } = true;
    }
} 
