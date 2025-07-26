using SecureAuth.APPLICATION.DTOs.Security;

namespace SecureAuth.APPLICATION.Queries.Security
{
    public class GetSecuritySettingsQuery : IQuery<SecuritySettingsModel>
    {
        public string SettingsSection { get; set; } = "All"; // "All", "Authentication", "Session", "ThreatDetection"
    }
} 
