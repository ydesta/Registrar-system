using SecureAuth.APPLICATION.Commands.Admin;
using SecureAuth.APPLICATION.DTOs.Admin;
using SecureAuth.APPLICATION.Interfaces;

namespace SecureAuth.APPLICATION.Commands.Admin
{
    public class GenerateSystemReportCommandHandler : ICommandHandler<GenerateSystemReportCommand, SystemReportModel>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IActivityLogService _activityLogService;

        public GenerateSystemReportCommandHandler(
            IUnitOfWork unitOfWork,
            IActivityLogService activityLogService)
        {
            _unitOfWork = unitOfWork;
            _activityLogService = activityLogService;
        }

        public async Task<SystemReportModel> HandleAsync(GenerateSystemReportCommand command)
        {
            try
            {
                var report = new SystemReportModel
                {
                    ReportId = Guid.NewGuid().ToString(),
                    ReportType = command.ReportType,
                    GeneratedAt = DateTime.UtcNow,
                    StartDate = command.StartDate,
                    EndDate = command.EndDate,
                    Format = command.Format
                };

                // Generate report based on type
                switch (command.ReportType.ToLower())
                {
                    case "useractivity":
                        report.Data = await GenerateUserActivityReport(command.StartDate, command.EndDate);
                        break;
                    case "securityaudit":
                        report.Data = await GenerateSecurityAuditReport(command.StartDate, command.EndDate);
                        break;
                    case "systemhealth":
                        report.Data = await GenerateSystemHealthReport(command.StartDate, command.EndDate);
                        break;
                    default:
                        return new SystemReportModel { Success = false, Message = "Invalid report type" };
                }

                // Log report generation
                await _activityLogService.LogUserActionAsync(
                    "System",
                    "GenerateSystemReport",
                    "SystemReport",
                    report.ReportId,
                    $"Generated {command.ReportType} report for period {command.StartDate:yyyy-MM-dd} to {command.EndDate:yyyy-MM-dd}");

                report.Success = true;
                report.Message = "Report generated successfully";
                return report;
            }
            catch (Exception ex)
            {
                return new SystemReportModel 
                { 
                    Success = false, 
                    Message = $"Error generating report: {ex.Message}" 
                };
            }
        }

        private async Task<object> GenerateUserActivityReport(DateTime startDate, DateTime endDate)
        {
            // Implementation for user activity report
            var userActivities = await _unitOfWork.AuditLogs.GetUserActivitiesAsync(startDate, endDate);
            return new
            {
                TotalLogins = userActivities.Count(a => a.ActionType == "UserLogin"),
                TotalRegistrations = userActivities.Count(a => a.ActionType == "UserRegistration"),
                FailedLoginAttempts = userActivities.Count(a => a.ActionType == "FailedLogin"),
                ActiveUsers = userActivities.Select(a => a.UserId).Distinct().Count()
            };
        }

        private async Task<object> GenerateSecurityAuditReport(DateTime startDate, DateTime endDate)
        {
            // Implementation for security audit report
            var securityEvents = await _unitOfWork.AuditLogs.GetSecurityEventsAsync(startDate, endDate);
            return new
            {
                SecurityViolations = securityEvents.Count(a => a.ActionType == "SecurityViolation"),
                PasswordChanges = securityEvents.Count(a => a.ActionType == "PasswordChange"),
                AccountLockouts = securityEvents.Count(a => a.ActionType == "AccountLockout"),
                SuspiciousActivities = securityEvents.Count(a => a.ActionType == "SuspiciousActivity")
            };
        }

        private async Task<object> GenerateSystemHealthReport(DateTime startDate, DateTime endDate)
        {
            // Implementation for system health report
            var systemEvents = await _unitOfWork.AuditLogs.GetSystemEventsAsync(startDate, endDate);
            return new
            {
                SystemErrors = systemEvents.Count(a => a.ActionType == "SystemError"),
                PerformanceIssues = systemEvents.Count(a => a.ActionType == "PerformanceIssue"),
                DatabaseConnections = systemEvents.Count(a => a.ActionType == "DatabaseConnection"),
                ServiceRestarts = systemEvents.Count(a => a.ActionType == "ServiceRestart")
            };
        }
    }
} 
