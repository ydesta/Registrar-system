namespace SecureAuth.APPLICATION.Interfaces
{
    public interface ISecurityEventService
    {
        Task RecordLoginAttemptAsync(string userId, string email, bool success, string ipAddress, string userAgent, string? errorMessage = null);
        Task RecordFailedLoginAsync(string email, string ipAddress, string userAgent, string reason);
        Task RecordSuspiciousActivityAsync(string userId, string activityType, string description, string ipAddress, string userAgent);
        Task RecordPasswordChangeAsync(string userId, bool success, string ipAddress, string userAgent);
        Task RecordRoleAssignmentAsync(string userId, string assignedBy, string roleName, bool success);
        Task RecordPermissionChangeAsync(string userId, string assignedBy, string permissionName, bool success);
        Task RecordSystemAccessAsync(string userId, string resource, string action, bool success, string ipAddress);
    }
} 