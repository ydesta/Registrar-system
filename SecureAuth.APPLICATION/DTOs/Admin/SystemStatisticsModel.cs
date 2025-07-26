namespace SecureAuth.APPLICATION.DTOs.Admin
{
    public class SystemStatisticsModel
    {
        public string TimeRange { get; set; } = string.Empty;
        public DateTime GeneratedAt { get; set; }
        public UserStatisticsModel? UserStatistics { get; set; }
        public SecurityStatisticsModel? SecurityStatistics { get; set; }
        public PerformanceMetricsModel? PerformanceMetrics { get; set; }
    }

    public class UserStatisticsModel
    {
        public int TotalUsers { get; set; }
        public int ActiveUsers { get; set; }
        public int NewRegistrations { get; set; }
        public int Logins { get; set; }
        public int FailedLogins { get; set; }
        public int LockedAccounts { get; set; }
    }

    public class SecurityStatisticsModel
    {
        public int SecurityViolations { get; set; }
        public int PasswordChanges { get; set; }
        public int AccountLockouts { get; set; }
        public int SuspiciousActivities { get; set; }
        public int TwoFactorEnrollments { get; set; }
    }

    public class PerformanceMetricsModel
    {
        public double AverageResponseTime { get; set; }
        public int RequestsPerMinute { get; set; }
        public double CpuUsage { get; set; }
        public double MemoryUsage { get; set; }
        public double DiskUsage { get; set; }
    }
} 
