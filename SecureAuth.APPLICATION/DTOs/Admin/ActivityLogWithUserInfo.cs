namespace SecureAuth.APPLICATION.DTOs.Admin
{
    /// <summary>
    /// Represents an activity log entry with associated user information
    /// </summary>
    public class ActivityLogWithUserInfo
    {
        /// <summary>
        /// Unique identifier for the activity log entry
        /// </summary>
        public string Id { get; set; } = string.Empty;

        /// <summary>
        /// ID of the user who performed the activity
        /// </summary>
        public string UserId { get; set; } = string.Empty;

        /// <summary>
        /// Full name of the user (FirstName + LastName)
        /// </summary>
        public string? FullName { get; set; }

        /// <summary>
        /// Email address of the user who performed the activity
        /// </summary>
        public string? UserEmail { get; set; }

        /// <summary>
        /// Type of action performed (e.g., Login, Logout, Create, Update, Delete)
        /// </summary>
        public string Action { get; set; } = string.Empty;

        /// <summary>
        /// Type of entity affected by the action (e.g., User, Role, Permission)
        /// </summary>
        public string EntityType { get; set; } = string.Empty;

        /// <summary>
        /// ID of the entity affected by the action
        /// </summary>
        public string EntityId { get; set; } = string.Empty;

        /// <summary>
        /// Additional details about the activity
        /// </summary>
        public string? Details { get; set; }

        /// <summary>
        /// IP address from which the activity originated
        /// </summary>
        public string? IpAddress { get; set; }

        /// <summary>
        /// User agent string from the client
        /// </summary>
        public string? UserAgent { get; set; }

        /// <summary>
        /// Timestamp when the activity occurred
        /// </summary>
        public DateTime Timestamp { get; set; }

        /// <summary>
        /// Whether the activity was successful
        /// </summary>
        public bool Status { get; set; }

        /// <summary>
        /// Error message if the activity failed
        /// </summary>
        public string? ErrorMessage { get; set; }
    }
} 