using SecureAuth.APPLICATION.DTOs.Admin;

namespace SecureAuth.APPLICATION.Queries.Admin
{
    public class GetSystemHealthQuery : IQuery<SystemHealthModel>
    {
        public bool IncludeDetailedMetrics { get; set; } = false;
        public bool IncludeDatabaseHealth { get; set; } = true;
        public bool IncludeServiceHealth { get; set; } = true;
    }
} 
