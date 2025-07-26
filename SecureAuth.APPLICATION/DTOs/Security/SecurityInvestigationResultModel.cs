using System.Collections.Generic;

namespace SecureAuth.APPLICATION.DTOs.Security
{
    public class SecurityInvestigationResultModel
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string IncidentId { get; set; } = string.Empty;
        public string InvestigationType { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public List<SecurityEventModel>? SecurityEvents { get; set; }
        public List<string>? AffectedUsers { get; set; }
        public string? RiskLevel { get; set; }
        public List<string>? Recommendations { get; set; }
    }

    public class SecurityEventModel
    {
        public string Id { get; set; } = string.Empty;
        public string EventType { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }
        public string? Description { get; set; }
        public string? Severity { get; set; }
    }
} 
