using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SecureAuth.INFRASTRUCTURE.Data;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.DOMAIN.Models;
using SecureAuth.DOMAIN.Models.Security;

namespace SecureAuth.INFRASTRUCTURE.Services.Security
{
    public class ActivityLogService : IActivityLogService
    {
        private readonly ILogger<ActivityLogService> _logger;
        private readonly ApplicationDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ActivityLogService(
            ILogger<ActivityLogService> logger,
            ApplicationDbContext context,
            IHttpContextAccessor httpContextAccessor)
        {
            _logger = logger;
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task LogActionAsync(string userId, string action, string details)
        {
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("Cannot log action: userId is null or empty");
                return;
            }

            if (string.IsNullOrEmpty(action))
            {
                _logger.LogWarning("Cannot log action: action is null or empty");
                return;
            }

            try
            {
                var activityLog = new ActivityLog
                {
                    UserId = userId,
                    Action = action,
                    EntityType = "User",
                    EntityId = userId,
                    Details = details,
                    IpAddress = GetClientIpAddress(),
                    UserAgent = GetUserAgent(),
                    Timestamp = DateTime.UtcNow,
                    Status = true
                };

                _context.ActivityLogs.Add(activityLog);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation("Activity logged: User {UserId} performed {Action}", userId, action);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error logging activity for user {UserId}", userId);
            }
        }

        public async Task LogRoleCreatedAsync(string userId, string roleId, string roleName)
        {
            if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(roleId) || string.IsNullOrEmpty(roleName))
            {
                _logger.LogWarning("Cannot log role creation: missing required parameters");
                return;
            }

            try
            {
                var activityLog = new ActivityLog
                {
                    UserId = userId,
                    Action = "RoleCreated",
                    EntityType = "Role",
                    EntityId = roleId,
                    Details = $"Role '{roleName}' was created",
                    IpAddress = GetClientIpAddress(),
                    UserAgent = GetUserAgent(),
                    Timestamp = DateTime.UtcNow,
                    Status = true
                };

                _context.ActivityLogs.Add(activityLog);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation("Role created: {RoleName} by user {UserId}", roleName, userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error logging role creation for user {UserId}", userId);
            }
        }

        public async Task LogPermissionCreatedAsync(string userId, string permissionId, string permissionName)
        {
            if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(permissionId) || string.IsNullOrEmpty(permissionName))
            {
                _logger.LogWarning("Cannot log permission creation: missing required parameters");
                return;
            }

            try
            {
                var activityLog = new ActivityLog
                {
                    UserId = userId,
                    Action = "PermissionCreated",
                    EntityType = "Permission",
                    EntityId = permissionId,
                    Details = $"Permission '{permissionName}' was created",
                    IpAddress = GetClientIpAddress(),
                    UserAgent = GetUserAgent(),
                    Timestamp = DateTime.UtcNow,
                    Status = true
                };

                _context.ActivityLogs.Add(activityLog);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation("Permission created: {PermissionName} by user {UserId}", permissionName, userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error logging permission creation for user {UserId}", userId);
            }
        }

        public async Task LogUserActionAsync(string userId, string action, string entityType, string entityId, string details = null)
        {
            if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(action) || string.IsNullOrEmpty(entityType) || string.IsNullOrEmpty(entityId))
            {
                _logger.LogWarning("Cannot log user action: missing required parameters");
                return;
            }

            try
            {
                var activityLog = new ActivityLog
                {
                    UserId = userId,
                    Action = action,
                    EntityType = entityType,
                    EntityId = entityId,
                    Details = details,
                    IpAddress = GetClientIpAddress(),
                    UserAgent = GetUserAgent(),
                    Timestamp = DateTime.UtcNow,
                    Status = true
                };

                _context.ActivityLogs.Add(activityLog);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation("User action logged: User {UserId} performed {Action} on {EntityType} {EntityId}", 
                    userId, action, entityType, entityId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error logging user action for user {UserId}", userId);
            }
        }

        public async Task<bool> LogActivityAsync(
            string userId,
            string action,
            string entityType,
            string entityId,
            string? details = null,
            bool status = true,
            string? errorMessage = null)
        {
            if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(action) || string.IsNullOrEmpty(entityType) || string.IsNullOrEmpty(entityId))
            {
                _logger.LogWarning("Cannot log activity: missing required parameters");
                return false;
            }

            try
            {
                var activityLog = new ActivityLog
                {
                    UserId = userId,
                    Action = action,
                    EntityType = entityType,
                    EntityId = entityId,
                    Details = details,
                    IpAddress = GetClientIpAddress(),
                    UserAgent = GetUserAgent(),
                    Timestamp = DateTime.UtcNow,
                    Status = status,
                    ErrorMessage = errorMessage
                };

                _context.ActivityLogs.Add(activityLog);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation("Activity logged: User {UserId} performed {Action} on {EntityType} {EntityId}", 
                    userId, action, entityType, entityId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error logging activity for user {UserId}", userId);
                return false;
            }
        }

        public async Task<bool> DeleteAuditLogAsync(string id)
        {
            if (string.IsNullOrEmpty(id))
            {
                _logger.LogWarning("Cannot delete audit log: id is null or empty");
                return false;
            }

            try
            {
                var log = await _context.ActivityLogs.FindAsync(id);
                if (log != null)
                {
                    _context.ActivityLogs.Remove(log);
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Audit log deleted: {Id}", id);
                    return true;
                }
                
                _logger.LogWarning("Audit log not found: {Id}", id);
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting audit log {Id}", id);
                return false;
            }
        }

        private string? GetClientIpAddress()
        {
            try
            {
                return _httpContextAccessor.HttpContext?.Connection?.RemoteIpAddress?.ToString();
            }
            catch
            {
                return null;
            }
        }

        private string? GetUserAgent()
        {
            try
            {
                return _httpContextAccessor.HttpContext?.Request?.Headers["User-Agent"].FirstOrDefault();
            }
            catch
            {
                return null;
            }
        }
    }
} 
