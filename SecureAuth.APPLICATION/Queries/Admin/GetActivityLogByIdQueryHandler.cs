using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.APPLICATION.Queries;
using SecureAuth.APPLICATION.Queries.Admin;
using SecureAuth.APPLICATION.DTOs.Admin;

namespace SecureAuth.APPLICATION.Queries.Admin
{
    public class GetActivityLogByIdQueryHandler : IQueryHandler<GetActivityLogByIdQuery, ActivityLogModel>
    {
        private readonly IActivityLogRepository _activityLogRepository;

        public GetActivityLogByIdQueryHandler(IActivityLogRepository activityLogRepository)
        {
            _activityLogRepository = activityLogRepository;
        }

        public async Task<ActivityLogModel> HandleAsync(GetActivityLogByIdQuery query)
        {
            var activityLog = await _activityLogRepository.GetByIdWithUserInfoAsync(query.Id);

            if (activityLog == null)
                return null!;

            return new ActivityLogModel
            {
                Id = activityLog.Id,
                UserId = activityLog.UserId,
                FullName = activityLog.FullName,
                UserEmail = activityLog.UserEmail,
                Action = activityLog.Action,
                EntityType = activityLog.EntityType,
                EntityId = activityLog.EntityId,
                Details = activityLog.Details ?? string.Empty,
                Timestamp = activityLog.Timestamp,
                IpAddress = activityLog.IpAddress,
                UserAgent = activityLog.UserAgent,
                Status = activityLog.Status,
                ErrorMessage = activityLog.ErrorMessage
            };
        }
    }
} 