using SecureAuth.APPLICATION.DTOs.Security;

namespace SecureAuth.APPLICATION.Queries.Security
{
    public class GetSecurityThreatsQuery : IQuery<List<SecurityThreatModel>>
    {
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? ThreatLevel { get; set; } // "Low", "Medium", "High", "Critical"
        public string? ThreatType { get; set; } // "BruteForce", "SuspiciousActivity", "DataBreach", "Malware"
        public bool IncludeResolved { get; set; } = false;
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 50;
    }
} 
