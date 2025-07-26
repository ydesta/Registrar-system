using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.APPLICATION.Queries;
using SecureAuth.APPLICATION.Queries.Admin;
using SecureAuth.APPLICATION.DTOs.Admin;
using SecureAuth.DOMAIN.Models.Security;
using SecureAuth.APPLICATION.Extensions;

namespace SecureAuth.APPLICATION.Queries.Admin
{
    public class GetActivityLogsQueryHandler : IQueryHandler<GetActivityLogsQuery, ActivityLogPagedResult>
    {
        private readonly IActivityLogRepository _activityLogRepository;

        public GetActivityLogsQueryHandler(IActivityLogRepository activityLogRepository)
        {
            _activityLogRepository = activityLogRepository;
        }

        public async Task<ActivityLogPagedResult> HandleAsync(GetActivityLogsQuery query)
        {
            // Create filter parameters from query
            var filterParams = new ActivityLogFilterParams
            {
                StartDate = query.StartDate,
                EndDate = query.EndDate,
                UserId = query.UserId,
                UserEmail = query.UserEmail,
                Action = query.ActionType,
                EntityType = query.EntityType,
                Limit = query.PageSize,
                Offset = (query.Page - 1) * query.PageSize
            };

            // Validate filter parameters
            var (isValid, errorMessage) = filterParams.Validate();
            if (!isValid)
            {
                throw new ArgumentException(errorMessage, nameof(query));
            }

            // Get filtered activity logs with user info
            var filteredLogs = await _activityLogRepository.GetFilteredWithUserInfoAsync(filterParams);

            // Get total count from filtered results
            var totalCount = await _activityLogRepository.GetFilteredCountAsync(filterParams);

            // Apply pagination to the results
            var pagedLogs = filteredLogs
                .Skip((query.Page - 1) * query.PageSize)
                .Take(query.PageSize)
                .ToList();

            // Map to DTO
            var items = pagedLogs.Select(log => new ActivityLogModel
            {
                Id = log.Id,
                UserId = log.UserId,
                FullName = log.FullName,
                UserEmail = log.UserEmail,
                Action = log.Action,
                EntityType = log.EntityType,
                EntityId = log.EntityId,
                Details = log.Details ?? string.Empty,
                Timestamp = log.Timestamp,
                IpAddress = log.IpAddress,
                UserAgent = log.UserAgent,
                Status = log.Status,
                ErrorMessage = log.ErrorMessage
            }).ToList();

            return new ActivityLogPagedResult
            {
                Items = items,
                TotalCount = totalCount,
                Page = query.Page,
                PageSize = query.PageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)query.PageSize)
            };
        }
    }
} 