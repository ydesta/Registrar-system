using SecureAuth.APPLICATION.DTOs.Admin;
using SecureAuth.APPLICATION.Queries;

namespace SecureAuth.APPLICATION.Queries.Admin
{
    public class GetActivityLogsQuery : IQuery<ActivityLogPagedResult>
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? UserId { get; set; }
        public string? UserEmail { get; set; }
        public string? ActionType { get; set; }
        public string? EntityType { get; set; }
    }
} 