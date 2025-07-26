using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SecureAuth.DOMAIN.Models
{
    public class SystemConfiguration
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        [StringLength(100)]
        public required string Key { get; set; }

        [Required]
        [StringLength(1000)]
        public required string Value { get; set; }

        [StringLength(500)]
        public string? Description { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        [StringLength(100)]
        public string? UpdatedBy { get; set; }

        public bool IsActive { get; set; } = true;
    }

    public class SystemBackup
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        [StringLength(200)]
        public required string BackupFileName { get; set; }

        [StringLength(500)]
        public string? Description { get; set; }

        [Required]
        [StringLength(50)]
        public required string BackupType { get; set; }

        public long FileSize { get; set; }

        [StringLength(500)]
        public string? FilePath { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [StringLength(100)]
        public string? CreatedBy { get; set; }

        public bool IsEncrypted { get; set; }

        public string? EncryptionKey { get; set; }

        public DateTime? ExpiresAt { get; set; }

        public bool IsActive { get; set; } = true;
    }

    public class AuditLog
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public required string UserId { get; set; }

        [Required]
        [StringLength(100)]
        public required string Action { get; set; }

        [Required]
        [StringLength(100)]
        public required string EntityType { get; set; }

        [Required]
        [StringLength(100)]
        public required string EntityId { get; set; }

        [StringLength(1000)]
        public string? Details { get; set; }

        [StringLength(50)]
        public string? IpAddress { get; set; }

        [StringLength(500)]
        public string? UserAgent { get; set; }

        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        public bool Status { get; set; }

        [StringLength(1000)]
        public string? ErrorMessage { get; set; }
    }

    public class ServiceHealth
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        [StringLength(100)]
        public required string ServiceName { get; set; }

        [Required]
        [StringLength(20)]
        public required string Status { get; set; }

        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        public int ResponseTime { get; set; }

        [StringLength(1000)]
        public string? ErrorMessage { get; set; }

        [StringLength(500)]
        public string? Details { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class DatabaseHealth
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        [StringLength(20)]
        public required string Status { get; set; }

        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        public int ResponseTime { get; set; }

        public int ActiveConnections { get; set; }

        [StringLength(1000)]
        public string? ErrorMessage { get; set; }

        [StringLength(500)]
        public string? Details { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class SystemMetrics
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        [StringLength(50)]
        public required string MetricType { get; set; }

        public float Value { get; set; }

        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        [StringLength(100)]
        public string? Unit { get; set; }

        [StringLength(500)]
        public string? Description { get; set; }
    }
} 