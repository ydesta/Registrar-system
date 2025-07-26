namespace SecureAuth.APPLICATION.DTOs.Admin
{
    /// <summary>
    /// Parameters for filtering activity logs at the repository level
    /// </summary>
    public class ActivityLogFilterParams
    {
        /// <summary>
        /// Start date for filtering activities (inclusive)
        /// </summary>
        public DateTime? StartDate { get; set; }

        /// <summary>
        /// End date for filtering activities (inclusive)
        /// </summary>
        public DateTime? EndDate { get; set; }

        /// <summary>
        /// User ID to filter activities by specific user
        /// </summary>
        public string? UserId { get; set; }

        /// <summary>
        /// User email to filter activities by email (case-insensitive partial match)
        /// </summary>
        public string? UserEmail { get; set; }

        /// <summary>
        /// Action type to filter activities (e.g., login, logout, create, update, delete)
        /// </summary>
        public string? Action { get; set; }

        /// <summary>
        /// Entity type to filter activities (e.g., User, Role, Permission)
        /// </summary>
        public string? EntityType { get; set; }

        /// <summary>
        /// Status to filter activities (true for successful, false for failed)
        /// </summary>
        public bool? Status { get; set; }

        /// <summary>
        /// IP address to filter activities by source IP
        /// </summary>
        public string? IpAddress { get; set; }

        /// <summary>
        /// Maximum number of records to return
        /// </summary>
        public int? Limit { get; set; }

        /// <summary>
        /// Number of records to skip (for pagination)
        /// </summary>
        public int? Offset { get; set; }
    }
} 