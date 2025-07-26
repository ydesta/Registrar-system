namespace SecureAuth.APPLICATION.DTOs.Admin
{
    public class ActivityLogModel
    {
        public string Id { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string? FullName { get; set; }
        public string? UserEmail { get; set; }
        public string Action { get; set; } = string.Empty;
        public string EntityType { get; set; } = string.Empty;
        public string EntityId { get; set; } = string.Empty;
        public string Details { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }
        public bool Status { get; set; }
        public string? ErrorMessage { get; set; }
    }

    public class ActivityLogPagedResult
    {
        public List<ActivityLogModel> Items { get; set; } = new List<ActivityLogModel>();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }
} 