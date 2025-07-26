using SecureAuth.APPLICATION.DTOs.Security;

namespace SecureAuth.APPLICATION.Queries.Security
{
    public class GetSecurityDashboardQuery : IQuery<SecurityDashboardModel>
    {
        public string TimeRange { get; set; } = "Last24Hours"; // "LastHour", "Last24Hours", "Last7Days", "Last30Days"
        public bool IncludeThreatMetrics { get; set; } = true;
        public bool IncludeUserSecurityMetrics { get; set; } = true;
        public bool IncludeSystemSecurityMetrics { get; set; } = true;
        public bool IncludeComplianceMetrics { get; set; } = false;
    }
} 
