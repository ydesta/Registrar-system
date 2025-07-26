using SecureAuth.APPLICATION.DTOs.Admin;
using Microsoft.EntityFrameworkCore;
using SecureAuth.DOMAIN.Models.Security;

namespace SecureAuth.APPLICATION.Extensions
{
    /// <summary>
    /// Extension methods for ActivityLog filtering
    /// </summary>
    public static class ActivityLogFilterExtensions
    {
        /// <summary>
        /// Applies filters to an IQueryable of ActivityLog entities
        /// </summary>
        /// <param name="query">The base query</param>
        /// <param name="filterParams">Filter parameters</param>
        /// <returns>Filtered query</returns>
        public static IQueryable<ActivityLog> ApplyFilters(this IQueryable<ActivityLog> query, ActivityLogFilterParams filterParams)
        {
            if (filterParams == null)
                return query;

            // Date range filters
            if (filterParams.StartDate.HasValue)
                query = query.Where(x => x.Timestamp >= filterParams.StartDate.Value);

            if (filterParams.EndDate.HasValue)
                query = query.Where(x => x.Timestamp <= filterParams.EndDate.Value);

            // User filters
            if (!string.IsNullOrEmpty(filterParams.UserId))
                query = query.Where(x => x.UserId == filterParams.UserId);

            // Action filter
            if (!string.IsNullOrEmpty(filterParams.Action))
                query = query.Where(x => x.Action == filterParams.Action);

            // Entity type filter
            if (!string.IsNullOrEmpty(filterParams.EntityType))
                query = query.Where(x => x.EntityType == filterParams.EntityType);

            // Status filter
            if (filterParams.Status.HasValue)
                query = query.Where(x => x.Status == filterParams.Status.Value);

            // IP address filter
            if (!string.IsNullOrEmpty(filterParams.IpAddress))
                query = query.Where(x => x.IpAddress != null && 
                    x.IpAddress.ToLower().Contains(filterParams.IpAddress.ToLower()));

            return query;
        }

        /// <summary>
        /// Applies email filter to a query that includes user information
        /// </summary>
        /// <param name="query">The base query with user information</param>
        /// <param name="userEmail">Email to filter by</param>
        /// <returns>Filtered query</returns>
        public static IQueryable<ActivityLog> ApplyEmailFilter(this IQueryable<ActivityLog> query, string? userEmail)
        {
            if (string.IsNullOrEmpty(userEmail))
                return query;

            return query.Where(x => x.User != null && 
                x.User.Email != null && 
                x.User.Email.ToLower().Contains(userEmail.ToLower()));
        }

        /// <summary>
        /// Applies pagination to a query
        /// </summary>
        /// <param name="query">The base query</param>
        /// <param name="offset">Number of records to skip</param>
        /// <param name="limit">Maximum number of records to return</param>
        /// <returns>Paginated query</returns>
        public static IQueryable<ActivityLog> ApplyPagination(this IQueryable<ActivityLog> query, int? offset, int? limit)
        {
            if (offset.HasValue && offset.Value > 0)
                query = query.Skip(offset.Value);

            if (limit.HasValue && limit.Value > 0)
                query = query.Take(limit.Value);

            return query;
        }

        /// <summary>
        /// Validates filter parameters
        /// </summary>
        /// <param name="filterParams">Filter parameters to validate</param>
        /// <returns>Validation result</returns>
        public static (bool IsValid, string? ErrorMessage) Validate(this ActivityLogFilterParams filterParams)
        {
            if (filterParams == null)
                return (true, null);

            // Validate date range
            if (filterParams.StartDate.HasValue && filterParams.EndDate.HasValue)
            {
                if (filterParams.StartDate.Value > filterParams.EndDate.Value)
                {
                    return (false, "Start date cannot be after end date");
                }
            }

            // Validate pagination
            if (filterParams.Offset.HasValue && filterParams.Offset.Value < 0)
            {
                return (false, "Offset cannot be negative");
            }

            if (filterParams.Limit.HasValue && filterParams.Limit.Value <= 0)
            {
                return (false, "Limit must be greater than zero");
            }

            // Validate string lengths
            if (!string.IsNullOrEmpty(filterParams.UserEmail) && filterParams.UserEmail.Length > 256)
            {
                return (false, "User email is too long");
            }

            if (!string.IsNullOrEmpty(filterParams.Action) && filterParams.Action.Length > 100)
            {
                return (false, "Action is too long");
            }

            if (!string.IsNullOrEmpty(filterParams.EntityType) && filterParams.EntityType.Length > 100)
            {
                return (false, "Entity type is too long");
            }

            return (true, null);
        }
    }
} 