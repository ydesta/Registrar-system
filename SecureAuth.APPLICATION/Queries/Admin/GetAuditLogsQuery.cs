using SecureAuth.APPLICATION.DTOs.Admin;

namespace SecureAuth.APPLICATION.Queries.Admin
{
    public class GetAuditLogsQuery : IQuery<List<AuditLogModel>>
    {
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? UserId { get; set; }
        public string? ActionType { get; set; }
        public string? EntityType { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 50;
        public string SortBy { get; set; } = "Timestamp";
        public bool SortDescending { get; set; } = true;
    }
} 
