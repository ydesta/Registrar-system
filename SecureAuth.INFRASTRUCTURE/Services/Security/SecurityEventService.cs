using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.DOMAIN.Models.Security;
using SecureAuth.INFRASTRUCTURE.Data;

namespace SecureAuth.INFRASTRUCTURE.Services.Security
{
    public class SecurityEventService : ISecurityEventService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<SecurityEventService> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public SecurityEventService(
            ApplicationDbContext context,
            ILogger<SecurityEventService> logger,
            IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task RecordLoginAttemptAsync(string userId, string email, bool success, string ipAddress, string userAgent, string? errorMessage = null)
        {
            try
            {
                var securityEvent = new SecurityEvent
                {
                    EventType = success ? "LoginSuccess" : "LoginFailed",
                    UserId = userId ?? "Unknown",
                    Severity = success ? "Low" : "Medium",
                    Description = success 
                        ? $"Successful login for user {email}" 
                        : $"Failed login attempt for {email}: {errorMessage}",
                    IpAddress = ipAddress,
                    UserAgent = userAgent,
                    Timestamp = DateTime.UtcNow
                };

                _context.SecurityEvents.Add(securityEvent);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Security event recorded: {EventType} for user {Email}", securityEvent.EventType, email);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error recording login attempt for user {Email}", email);
            }
        }

        public async Task RecordFailedLoginAsync(string email, string ipAddress, string userAgent, string reason)
        {
            try
            {
                var securityEvent = new SecurityEvent
                {
                    EventType = "LoginFailed",
                    UserId = "Unknown",
                    Severity = "Medium",
                    Description = $"Failed login attempt for {email}: {reason}",
                    IpAddress = ipAddress,
                    UserAgent = userAgent,
                    Timestamp = DateTime.UtcNow
                };

                _context.SecurityEvents.Add(securityEvent);
                await _context.SaveChangesAsync();

                _logger.LogWarning("Failed login recorded for {Email} from {IpAddress}", email, ipAddress);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error recording failed login for {Email}", email);
            }
        }

        public async Task RecordSuspiciousActivityAsync(string userId, string activityType, string description, string ipAddress, string userAgent)
        {
            try
            {
                var securityEvent = new SecurityEvent
                {
                    EventType = "SuspiciousActivity",
                    UserId = userId,
                    Severity = "High",
                    Description = $"{activityType}: {description}",
                    IpAddress = ipAddress,
                    UserAgent = userAgent,
                    Timestamp = DateTime.UtcNow
                };

                _context.SecurityEvents.Add(securityEvent);
                await _context.SaveChangesAsync();

                _logger.LogWarning("Suspicious activity recorded: {ActivityType} for user {UserId}", activityType, userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error recording suspicious activity for user {UserId}", userId);
            }
        }

        public async Task RecordPasswordChangeAsync(string userId, bool success, string ipAddress, string userAgent)
        {
            try
            {
                var securityEvent = new SecurityEvent
                {
                    EventType = success ? "PasswordChanged" : "PasswordChangeFailed",
                    UserId = userId,
                    Severity = "Medium",
                    Description = success ? "Password changed successfully" : "Password change failed",
                    IpAddress = ipAddress,
                    UserAgent = userAgent,
                    Timestamp = DateTime.UtcNow
                };

                _context.SecurityEvents.Add(securityEvent);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Password change event recorded for user {UserId}: {Success}", userId, success);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error recording password change for user {UserId}", userId);
            }
        }

        public async Task RecordRoleAssignmentAsync(string userId, string assignedBy, string roleName, bool success)
        {
            try
            {
                var securityEvent = new SecurityEvent
                {
                    EventType = success ? "RoleAssigned" : "RoleAssignmentFailed",
                    UserId = userId,
                    Severity = "Medium",
                    Description = success 
                        ? $"Role '{roleName}' assigned by {assignedBy}" 
                        : $"Failed to assign role '{roleName}' to user",
                    IpAddress = GetClientIpAddress(),
                    UserAgent = GetUserAgent(),
                    Timestamp = DateTime.UtcNow
                };

                _context.SecurityEvents.Add(securityEvent);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Role assignment event recorded: {RoleName} to {UserId} by {AssignedBy}", roleName, userId, assignedBy);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error recording role assignment for user {UserId}", userId);
            }
        }

        public async Task RecordPermissionChangeAsync(string userId, string assignedBy, string permissionName, bool success)
        {
            try
            {
                var securityEvent = new SecurityEvent
                {
                    EventType = success ? "PermissionChanged" : "PermissionChangeFailed",
                    UserId = userId,
                    Severity = "Medium",
                    Description = success 
                        ? $"Permission '{permissionName}' changed by {assignedBy}" 
                        : $"Failed to change permission '{permissionName}'",
                    IpAddress = GetClientIpAddress(),
                    UserAgent = GetUserAgent(),
                    Timestamp = DateTime.UtcNow
                };

                _context.SecurityEvents.Add(securityEvent);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Permission change event recorded: {PermissionName} for {UserId} by {AssignedBy}", permissionName, userId, assignedBy);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error recording permission change for user {UserId}", userId);
            }
        }

        public async Task RecordSystemAccessAsync(string userId, string resource, string action, bool success, string ipAddress)
        {
            try
            {
                var securityEvent = new SecurityEvent
                {
                    EventType = success ? "SystemAccess" : "SystemAccessDenied",
                    UserId = userId,
                    Severity = success ? "Low" : "Medium",
                    Description = success 
                        ? $"Access to {resource} - {action}" 
                        : $"Access denied to {resource} - {action}",
                    IpAddress = ipAddress,
                    UserAgent = GetUserAgent(),
                    Timestamp = DateTime.UtcNow
                };

                _context.SecurityEvents.Add(securityEvent);
                await _context.SaveChangesAsync();

                _logger.LogInformation("System access event recorded: {Resource} {Action} by {UserId}", resource, action, userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error recording system access for user {UserId}", userId);
            }
        }

        private string? GetClientIpAddress()
        {
            return _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString();
        }

        private string? GetUserAgent()
        {
            return _httpContextAccessor.HttpContext?.Request.Headers["User-Agent"].ToString();
        }
    }
} 