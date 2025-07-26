using System.Collections.Generic;

namespace SecureAuth.APPLICATION.DTOs.Security
{
    public class UserSecurityStatusModel
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public bool IsLockedOut { get; set; }
        public DateTime? LockoutEnd { get; set; }
        public int FailedLoginAttempts { get; set; }
        public DateTime? LastLoginDate { get; set; }
        public bool TwoFactorEnabled { get; set; }
        public bool EmailConfirmed { get; set; }
        public bool PhoneNumberConfirmed { get; set; }
        public RiskAssessmentModel? RiskAssessment { get; set; }
        public List<SecurityEventModel>? SecurityEvents { get; set; }
        public ComplianceStatusModel? ComplianceStatus { get; set; }
    }

    public class RiskAssessmentModel
    {
        public int RiskScore { get; set; }
        public string RiskLevel { get; set; } = string.Empty;
        public List<string> RiskFactors { get; set; } = new List<string>();
        public DateTime LastAssessed { get; set; }
    }

    public class ComplianceStatusModel
    {
        public bool PasswordCompliant { get; set; }
        public bool TwoFactorCompliant { get; set; }
        public bool EmailCompliant { get; set; }
        public bool AccountCompliant { get; set; }
        public bool OverallCompliant { get; set; }
        public DateTime LastComplianceCheck { get; set; }
    }
} 
