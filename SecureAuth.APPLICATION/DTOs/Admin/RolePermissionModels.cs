using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;

namespace SecureAuth.APPLICATION.DTOs.Admin
{
    public class CreateRoleModel
    {
        [Required]
        [StringLength(50)]
        public string Name { get; set; }

        [StringLength(200)]
        public string Description { get; set; }

        public bool IsActive { get; set; } = true;

        public List<string> PermissionIds { get; set; } = new List<string>();
    }

    public class UpdateRoleModel
    {
        [Required]
        [StringLength(50)]
        public string Name { get; set; }

        [StringLength(200)]
        public string Description { get; set; }

        public bool IsActive { get; set; } = true;
    }

    public class CreatePermissionModel
    {
        [Required]
        [StringLength(50)]
        public string Name { get; set; }

        [StringLength(200)]
        public string Description { get; set; }
    }

    public class AssignPermissionModel
    {
        [Required]
        public string PermissionId { get; set; }
    }

    public class AssignPermissionsBulkModel
    {
        [Required]
        public List<string> PermissionIds { get; set; } = new List<string>();
        
        public string? CurrentUserId { get; set; }
    }

    public class RoleResponseModel
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public int UserCount { get; set; }
        public int PermissionCount { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; }
        public List<PermissionResponseModel> Permissions { get; set; } = new List<PermissionResponseModel>();
    }

    public class PermissionResponseModel
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public string Category { get; set; }
        public int RoleCount { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class RolePermissionResponseModel
    {
        public string RoleId { get; set; }
        public string RoleName { get; set; }
        public string PermissionId { get; set; }
        public string PermissionName { get; set; }
        public DateTime AssignedAt { get; set; }
        public DateTime? RemovedAt { get; set; }
    }

    public class RoleDetailsResponseModel
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public List<PermissionResponseModel> Permissions { get; set; } = new List<PermissionResponseModel>();
        public List<UserResponseModel> Users { get; set; } = new List<UserResponseModel>();
        public DateTime CreatedAt { get; set; }
    }

    public class UserResponseModel
    {
        public string Id { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    // New models for CQRS implementation
    public class RoleModel
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string NormalizedName { get; set; } = string.Empty;
        public string? ConcurrencyStamp { get; set; }
        public int UserCount { get; set; } = 0;
        public string? Description { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class PermissionModel
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Category { get; set; }
        public bool IsActive { get; set; } = true;
    }
} 
