using SecureAuth.APPLICATION.DTOs.Security;

namespace SecureAuth.APPLICATION.Commands.Security
{
    public class UpdateSecurityThreatCommand : ICommand<SecurityThreatModel>
    {
        public string ThreatId { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? ResolutionNotes { get; set; }
        public string? ResolvedBy { get; set; }
    }
} 