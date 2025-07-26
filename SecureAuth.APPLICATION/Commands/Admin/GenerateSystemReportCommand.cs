using SecureAuth.APPLICATION.DTOs.Admin;

namespace SecureAuth.APPLICATION.Commands.Admin
{
    public class GenerateSystemReportCommand : ICommand<SystemReportModel>
    {
        public string ReportType { get; set; } = string.Empty; // "UserActivity", "SecurityAudit", "SystemHealth"
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Format { get; set; } = "PDF"; // "PDF", "Excel", "CSV"
    }
} 
