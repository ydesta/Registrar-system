using Microsoft.EntityFrameworkCore;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.DOMAIN.Models.Security;
using SecureAuth.DOMAIN.Models;
using SecureAuth.INFRASTRUCTURE.Data;
using SecureAuth.APPLICATION.DTOs.Admin;
using SecureAuth.APPLICATION.Extensions;

namespace SecureAuth.INFRASTRUCTURE.Services.Repositories
{
    public class ActivityLogRepository : Repository<ActivityLog>, IActivityLogRepository
    {
        public ActivityLogRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<ActivityLog>> GetAllAsync()
        {
            return await _context.Set<ActivityLog>()
                .OrderByDescending(x => x.Timestamp)
                .ToListAsync();
        }

        public async Task<IEnumerable<ActivityLogWithUserInfo>> GetAllWithUserInfoAsync()
        {
            return await _context.Set<ActivityLog>()
                .Include(x => x.User)
                .OrderByDescending(x => x.Timestamp)
                .Select(log => new ActivityLogWithUserInfo
                {
                    Id = log.Id,
                    UserId = log.UserId,
                    FullName = GetUserFullName(log.User),
                    UserEmail = log.User.Email ?? "N/A",
                    Action = log.Action,
                    EntityType = log.EntityType,
                    EntityId = log.EntityId,
                    Details = log.Details,
                    IpAddress = log.IpAddress,
                    UserAgent = log.UserAgent,
                    Timestamp = log.Timestamp,
                    Status = log.Status,
                    ErrorMessage = log.ErrorMessage
                })
                .ToListAsync();
        }

        public async Task<IEnumerable<ActivityLogWithUserInfo>> GetFilteredWithUserInfoAsync(ActivityLogFilterParams filterParams)
        {
            // Validate filter parameters
            var (isValid, errorMessage) = filterParams.Validate();
            if (!isValid)
            {
                throw new ArgumentException(errorMessage, nameof(filterParams));
            }

            var query = _context.Set<ActivityLog>()
                .Include(x => x.User)
                .AsNoTracking() // Performance optimization
                .AsQueryable();

            // Apply filters using extension methods
            query = query.ApplyFilters(filterParams);
            query = query.ApplyEmailFilter(filterParams.UserEmail);

            return await query
                .OrderByDescending(x => x.Timestamp)
                .Select(log => new ActivityLogWithUserInfo
                {
                    Id = log.Id,
                    UserId = log.UserId,
                    FullName = GetUserFullName(log.User),
                    UserEmail = log.User.Email ?? "N/A",
                    Action = log.Action,
                    EntityType = log.EntityType,
                    EntityId = log.EntityId,
                    Details = log.Details,
                    IpAddress = log.IpAddress,
                    UserAgent = log.UserAgent,
                    Timestamp = log.Timestamp,
                    Status = log.Status,
                    ErrorMessage = log.ErrorMessage
                })
                .ToListAsync();
        }

        public async Task<ActivityLog?> GetByIdAsync(string id)
        {
            return await _context.Set<ActivityLog>()
                .AsNoTracking() // Performance optimization
                .FirstOrDefaultAsync(x => x.Id == id);
        }

        public async Task<ActivityLogWithUserInfo?> GetByIdWithUserInfoAsync(string id)
        {
            return await _context.Set<ActivityLog>()
                .Include(x => x.User)
                .AsNoTracking() // Performance optimization
                .Where(x => x.Id == id)
                .Select(log => new ActivityLogWithUserInfo
                {
                    Id = log.Id,
                    UserId = log.UserId,
                    FullName = GetUserFullName(log.User),
                    UserEmail = log.User.Email ?? "N/A",
                    Action = log.Action,
                    EntityType = log.EntityType,
                    EntityId = log.EntityId,
                    Details = log.Details,
                    IpAddress = log.IpAddress,
                    UserAgent = log.UserAgent,
                    Timestamp = log.Timestamp,
                    Status = log.Status,
                    ErrorMessage = log.ErrorMessage
                })
                .FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<ActivityLog>> GetByUserIdAsync(string userId)
        {
            return await _context.Set<ActivityLog>()
                .AsNoTracking() // Performance optimization
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.Timestamp)
                .ToListAsync();
        }

        public async Task<IEnumerable<ActivityLog>> GetByDateRangeAsync(DateTime startDate, DateTime endDate)
        {
            return await _context.Set<ActivityLog>()
                .AsNoTracking() // Performance optimization
                .Where(x => x.Timestamp >= startDate && x.Timestamp <= endDate)
                .OrderByDescending(x => x.Timestamp)
                .ToListAsync();
        }

        public async Task<IEnumerable<ActivityLog>> GetByActionAsync(string action)
        {
            return await _context.Set<ActivityLog>()
                .AsNoTracking() // Performance optimization
                .Where(x => x.Action == action)
                .OrderByDescending(x => x.Timestamp)
                .ToListAsync();
        }

        public async Task<IEnumerable<ActivityLog>> GetByEntityTypeAsync(string entityType)
        {
            return await _context.Set<ActivityLog>()
                .AsNoTracking() // Performance optimization
                .Where(x => x.EntityType == entityType)
                .OrderByDescending(x => x.Timestamp)
                .ToListAsync();
        }

        public async Task<int> GetCountAsync()
        {
            return await _context.Set<ActivityLog>()
                .AsNoTracking() // Performance optimization
                .CountAsync();
        }

        public async Task<int> GetFilteredCountAsync(ActivityLogFilterParams filterParams)
        {
            // Validate filter parameters
            var (isValid, errorMessage) = filterParams.Validate();
            if (!isValid)
            {
                throw new ArgumentException(errorMessage, nameof(filterParams));
            }

            var query = _context.Set<ActivityLog>()
                .Include(x => x.User)
                .AsNoTracking() // Performance optimization
                .AsQueryable();

            // Apply filters using extension methods
            query = query.ApplyFilters(filterParams);
            query = query.ApplyEmailFilter(filterParams.UserEmail);

            return await query.CountAsync();
        }

        public async Task<bool> AddAsync(ActivityLog activityLog)
        {
            try
            {
                await _context.Set<ActivityLog>().AddAsync(activityLog);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> DeleteAsync(string id)
        {
            try
            {
                var activityLog = await GetByIdAsync(id);
                if (activityLog == null)
                    return false;

                _context.Set<ActivityLog>().Remove(activityLog);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        private static string GetUserFullName(ApplicationUser? user)
        {
            if (user == null)
                return "Unknown User";

            var firstName = user.FirstName?.Trim();
            var lastName = user.LastName?.Trim();

            if (string.IsNullOrEmpty(firstName) && string.IsNullOrEmpty(lastName))
                return "Unknown User";

            if (string.IsNullOrEmpty(firstName))
                return lastName;

            if (string.IsNullOrEmpty(lastName))
                return firstName;

            return $"{firstName} {lastName}";
        }
    }
} 