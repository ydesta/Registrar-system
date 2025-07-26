using SecureAuth.APPLICATION.DTOs.Security;

namespace SecureAuth.APPLICATION.Commands.Security
{
    public class InvestigateSecurityIncidentCommand : ICommand<SecurityInvestigationResultModel>
    {
        public string IncidentId { get; set; } = string.Empty;
        public string InvestigationType { get; set; } = "Full"; // "Full", "Quick", "Targeted"
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public List<string> UserIds { get; set; } = new(); // Specific users to investigate
        public List<string> EventTypes { get; set; } = new(); // Specific event types to focus on
    }
} 
