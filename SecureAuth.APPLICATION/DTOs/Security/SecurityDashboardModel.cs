namespace SecureAuth.APPLICATION.DTOs.Security
{
    public class SecurityDashboardModel
    {
        public string TimeRange { get; set; } = string.Empty;
        public DateTime GeneratedAt { get; set; }
        public ThreatMetricsModel? ThreatMetrics { get; set; }
        public UserSecurityMetricsModel? UserSecurityMetrics { get; set; }
        public SystemSecurityMetricsModel? SystemSecurityMetrics { get; set; }
        public ComplianceMetricsModel? ComplianceMetrics { get; set; }
    }

    public class ThreatMetricsModel
    {
        public int TotalThreats { get; set; }
        public int CriticalThreats { get; set; }
        public int HighThreats { get; set; }
        public int MediumThreats { get; set; }
        public int LowThreats { get; set; }
        public int ResolvedThreats { get; set; }
        public int PendingThreats { get; set; }
    }

    public class UserSecurityMetricsModel
    {
        public int UsersWithHighRisk { get; set; }
        public int UsersWithMediumRisk { get; set; }
        public int UsersWithLowRisk { get; set; }
        public int LockedAccounts { get; set; }
        public int AccountsRequiringPasswordChange { get; set; }
        public int UsersWithoutTwoFactor { get; set; }
    }

    public class SystemSecurityMetricsModel
    {
        public int FailedLoginAttempts { get; set; }
        public int SecurityViolations { get; set; }
        public int SuspiciousActivities { get; set; }
        public int BruteForceAttempts { get; set; }
        public int DataBreachAttempts { get; set; }
    }

    public class ComplianceMetricsModel
    {
        public int CompliantUsers { get; set; }
        public int NonCompliantUsers { get; set; }
        public double ComplianceRate { get; set; }
        public int PasswordPolicyViolations { get; set; }
        public int TwoFactorPolicyViolations { get; set; }
    }
} 
