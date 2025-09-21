using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SecureAuth.DOMAIN.Models.Security
{
    public class Permission
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        [StringLength(100)]
        public required string Name { get; set; }

        [StringLength(500)]
        public string? Description { get; set; }

        [StringLength(50)]
        public string? Category { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public virtual ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
    }

    public class RolePermission
    {
        [Required]
        public required string RoleId { get; set; }

        [Required]
        public required string PermissionId { get; set; }

        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("RoleId")]
        public virtual ApplicationRole? Role { get; set; }

        [ForeignKey("PermissionId")]
        public virtual Permission? Permission { get; set; }
    }

    public class UserRoleAssignment
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public required string UserId { get; set; }

        [Required]
        public required string RoleId { get; set; }

        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

        public string? AssignedBy { get; set; }

        public DateTime? ExpiresAt { get; set; }

        public bool IsActive { get; set; } = true;

        [ForeignKey("UserId")]
        public virtual ApplicationUser? User { get; set; }

        [ForeignKey("RoleId")]
        public virtual ApplicationRole? Role { get; set; }

        [ForeignKey("AssignedBy")]
        public virtual ApplicationUser? AssignedByUser { get; set; }
    }

    public class ActivityLog
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

        [ForeignKey("UserId")]
        public virtual ApplicationUser? User { get; set; }
    }

    public class PasswordHistory
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public required string UserId { get; set; }

        [Required]
        public required string PasswordHash { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Required]
        public required string ChangedBy { get; set; }

        [Required]
        public required string ChangeReason { get; set; }

        [ForeignKey("UserId")]
        public virtual ApplicationUser? User { get; set; }
    }

    public class SecurityEvent
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public required string UserId { get; set; }

        [Required]
        [StringLength(100)]
        public required string EventType { get; set; }

        [Required]
        [StringLength(20)]
        public required string Severity { get; set; }

        [StringLength(1000)]
        public string? Description { get; set; }

        [StringLength(50)]
        public string? IpAddress { get; set; }

        [StringLength(500)]
        public string? UserAgent { get; set; }

        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        public bool IsResolved { get; set; } = false;

        [StringLength(1000)]
        public string? ResolutionNotes { get; set; }

        [ForeignKey("UserId")]
        public virtual ApplicationUser? User { get; set; }
    }

    public class SecurityThreat
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        [StringLength(100)]
        public required string ThreatType { get; set; }

        [Required]
        [StringLength(20)]
        public required string Status { get; set; }

        [Required]
        [StringLength(20)]
        public required string Severity { get; set; }

        [StringLength(1000)]
        public string? Description { get; set; }

        [StringLength(50)]
        public string? SourceIp { get; set; }

        [StringLength(500)]
        public string? UserAgent { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? ResolvedAt { get; set; }

        [StringLength(100)]
        public string? ResolvedBy { get; set; }

        [StringLength(1000)]
        public string? ResolutionNotes { get; set; }

        public bool IsActive { get; set; } = true;
    }

    public class SecuritySettings
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
} 