using System.Collections.Generic;

namespace SecureAuth.APPLICATION.DTOs.Security
{
    public class SecurityThreatModel
    {
        public string Id { get; set; } = string.Empty;
        public string ThreatType { get; set; } = string.Empty;
        public string ThreatLevel { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime DetectedAt { get; set; }
        public DateTime? ResolvedAt { get; set; }
        public string Status { get; set; } = string.Empty;
        public List<string>? AffectedUsers { get; set; }
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }
        public List<string>? Recommendations { get; set; }
    }
} 
