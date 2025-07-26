using SecureAuth.APPLICATION.DTOs.Security;

namespace SecureAuth.APPLICATION.Commands.Security
{
    public class CreateSecurityThreatCommand : ICommand<SecurityThreatModel>
    {
        public string ThreatType { get; set; } = string.Empty;
        public string Severity { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? SourceIp { get; set; }
        public string? UserAgent { get; set; }
        public string? UserId { get; set; }
    }
} 