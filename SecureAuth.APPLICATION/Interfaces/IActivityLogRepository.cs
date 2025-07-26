using SecureAuth.DOMAIN.Models.Security;
using SecureAuth.APPLICATION.DTOs.Admin;

namespace SecureAuth.APPLICATION.Interfaces
{
    public interface IActivityLogRepository
    {
        Task<IEnumerable<ActivityLog>> GetAllAsync();
        Task<IEnumerable<ActivityLogWithUserInfo>> GetAllWithUserInfoAsync();
        Task<IEnumerable<ActivityLogWithUserInfo>> GetFilteredWithUserInfoAsync(ActivityLogFilterParams filterParams);
        Task<int> GetFilteredCountAsync(ActivityLogFilterParams filterParams);
        Task<ActivityLog?> GetByIdAsync(string id);
        Task<ActivityLogWithUserInfo?> GetByIdWithUserInfoAsync(string id);
        Task<IEnumerable<ActivityLog>> GetByUserIdAsync(string userId);
        Task<IEnumerable<ActivityLog>> GetByDateRangeAsync(DateTime startDate, DateTime endDate);
        Task<IEnumerable<ActivityLog>> GetByActionAsync(string action);
        Task<IEnumerable<ActivityLog>> GetByEntityTypeAsync(string entityType);
        Task<int> GetCountAsync();
        Task<bool> AddAsync(ActivityLog activityLog);
        Task<bool> DeleteAsync(string id);
    }
} 