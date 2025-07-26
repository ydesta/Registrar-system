using System.ComponentModel.DataAnnotations;
using System;
using System.Collections.Generic;

namespace SecureAuth.APPLICATION.DTOs.Admin
{
    public class ActivityLogFilterModel
    {
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? UserId { get; set; }
        public string? UserEmail { get; set; }
        public string? Action { get; set; }
        public string? EntityType { get; set; }
        public bool? Status { get; set; }
        public int? Page { get; set; } = 1;
        public int? PageSize { get; set; } = 10;
    }

    public class ActivityLogResponseModel
    {
        public string Id { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string? FullName { get; set; }
        public string? UserEmail { get; set; }
        public string Action { get; set; } = string.Empty;
        public string EntityType { get; set; } = string.Empty;
        public string EntityId { get; set; } = string.Empty;
        public string Details { get; set; } = string.Empty;
        public string IpAddress { get; set; } = string.Empty;
        public string UserAgent { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public bool Status { get; set; }
        public string? ErrorMessage { get; set; }
    }

    public class PaginatedResponseModel<T>
    {
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
        public List<T> Items { get; set; } = new();
    }

    public class RestoreDatabaseModel
    {
        [Required]
        public string BackupFileName { get; set; }

        [Required]
        public string Password { get; set; }
    }

    public class UpdateConfigurationModel
    {
        [Required]
        public string Key { get; set; }

        [Required]
        public string Value { get; set; }

        public string Details { get; set; }
    }

    public class SystemStatusResponseModel
    {
        public string Version { get; set; }
        public DateTime StartTime { get; set; }
        public TimeSpan Uptime { get; set; }
        public int ActiveUsers { get; set; }
        public int TotalUsers { get; set; }
        public int TotalRoles { get; set; }
        public int TotalPermissions { get; set; }
        public DateTime LastBackup { get; set; }
        public string DatabaseSize { get; set; }
        public string ServerTime { get; set; }
        public Dictionary<string, string> Configuration { get; set; }
    }

    public class SystemStatusResponse
    {
        public string Version { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }
        public TimeSpan Uptime { get; set; }
        public int ActiveUsers { get; set; }
        public int TotalUsers { get; set; }
        public int TotalRoles { get; set; }
        public int TotalPermissions { get; set; }
        public DateTime LastBackup { get; set; }
        public string DatabaseSize { get; set; } = string.Empty;
        public DateTime ServerTime { get; set; }
        public SystemConfigurationResponse Configuration { get; set; } = new();
    }

    public class SystemConfigurationResponse
    {
        public int MaxLoginAttempts { get; set; }
        public int LockoutDuration { get; set; }
        public int PasswordExpiryDays { get; set; }
        public bool RequireTwoFactor { get; set; }
        public int SessionTimeout { get; set; }
    }

    public class SystemConfigurationRequest
    {
        public int MaxLoginAttempts { get; set; }
        public int LockoutDuration { get; set; }
        public int PasswordExpiryDays { get; set; }
        public bool RequireTwoFactor { get; set; }
        public int SessionTimeout { get; set; }
    }

    public class DatabaseRestoreRequest
    {
        [Required]
        public string BackupFileName { get; set; } = string.Empty;
    }

    // New models for CQRS implementation
    public class SystemConfigurationModel
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string ConfigurationSection { get; set; } = "All";
        public SystemSecuritySettingsModel? SecuritySettings { get; set; }
        public EmailSettingsModel? EmailSettings { get; set; }
        public DatabaseSettingsModel? DatabaseSettings { get; set; }
        public LoggingSettingsModel? LoggingSettings { get; set; }
    }

    public class SystemSecuritySettingsModel
    {
        public int PasswordMinLength { get; set; } = 8;
        public int SessionTimeoutMinutes { get; set; } = 30;
        public int MaxLoginAttempts { get; set; } = 5;
        public int LockoutDurationMinutes { get; set; } = 15;
        public bool RequireTwoFactor { get; set; } = false;
    }

    public class EmailSettingsModel
    {
        public string SmtpServer { get; set; } = string.Empty;
        public int SmtpPort { get; set; } = 587;
        public string FromEmail { get; set; } = string.Empty;
        public string FromName { get; set; } = string.Empty;
        public bool EnableSsl { get; set; } = true;
    }

    public class DatabaseSettingsModel
    {
        public string ConnectionString { get; set; } = string.Empty;
        public int CommandTimeout { get; set; } = 30;
        public bool EnableRetryOnFailure { get; set; } = true;
    }

    public class LoggingSettingsModel
    {
        public string LogLevel { get; set; } = "Information";
        public string LogFilePath { get; set; } = string.Empty;
        public bool EnableConsoleLogging { get; set; } = true;
        public bool EnableFileLogging { get; set; } = true;
    }

    public class SystemHealthModel
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string OverallStatus { get; set; } = string.Empty;
        public DateTime CheckedAt { get; set; }
        public DatabaseHealthModel? DatabaseHealth { get; set; }
        public ServiceHealthModel? ServiceHealth { get; set; }
        public DetailedMetricsModel? DetailedMetrics { get; set; }
    }

    public class DatabaseHealthModel
    {
        public bool IsConnected { get; set; }
        public string Status { get; set; } = string.Empty;
        public int ResponseTime { get; set; }
        public int ActiveConnections { get; set; }
    }

    public class ServiceHealthModel
    {
        public string Status { get; set; } = string.Empty;
        public string AuthenticationService { get; set; } = string.Empty;
        public string EmailService { get; set; } = string.Empty;
        public string NotificationService { get; set; } = string.Empty;
    }

    public class DetailedMetricsModel
    {
        public double CpuUsage { get; set; }
        public double MemoryUsage { get; set; }
        public double DiskUsage { get; set; }
        public double NetworkLatency { get; set; }
        public int ActiveSessions { get; set; }
        public int RequestsPerMinute { get; set; }
    }

    public class AdminDashboardResponseModel
    {
        public int TotalUsers { get; set; }
        public int ActiveUsers { get; set; }
        public int TotalRoles { get; set; }
        public int TotalPermissions { get; set; }
        public TimeSpan SystemUptime { get; set; }
        public DateTime LastBackup { get; set; }
        public string DatabaseSize { get; set; } = string.Empty;
        public List<ActivityLogResponseModel> RecentActivity { get; set; } = new();
    }

    public class ClearAuditLogsRequest
    {
        public int OlderThanDays { get; set; } = 30;
        public int KeepLastRecords { get; set; } = 1000;
    }
} 
