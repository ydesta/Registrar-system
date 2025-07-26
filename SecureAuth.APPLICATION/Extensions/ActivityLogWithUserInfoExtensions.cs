using SecureAuth.APPLICATION.DTOs.Admin;

namespace SecureAuth.APPLICATION.Extensions
{
    /// <summary>
    /// Extension methods for ActivityLogWithUserInfo
    /// </summary>
    public static class ActivityLogWithUserInfoExtensions
    {
        /// <summary>
        /// Gets a display-friendly activity description
        /// </summary>
        /// <param name="activityLog">The activity log entry</param>
        /// <returns>Formatted activity description</returns>
        public static string GetActivityDescription(this ActivityLogWithUserInfo activityLog)
        {
            if (activityLog == null)
                return string.Empty;

            var userInfo = !string.IsNullOrEmpty(activityLog.FullName) 
                ? activityLog.FullName 
                : activityLog.UserEmail ?? "Unknown User";

            return $"{userInfo} performed {activityLog.Action} on {activityLog.EntityType}";
        }

        /// <summary>
        /// Gets a short summary of the activity
        /// </summary>
        /// <param name="activityLog">The activity log entry</param>
        /// <returns>Short activity summary</returns>
        public static string GetActivitySummary(this ActivityLogWithUserInfo activityLog)
        {
            if (activityLog == null)
                return string.Empty;

            return $"{activityLog.Action} - {activityLog.EntityType}";
        }

        /// <summary>
        /// Checks if the activity was performed by a specific user
        /// </summary>
        /// <param name="activityLog">The activity log entry</param>
        /// <param name="userId">User ID to check</param>
        /// <returns>True if the activity was performed by the specified user</returns>
        public static bool IsPerformedByUser(this ActivityLogWithUserInfo activityLog, string userId)
        {
            if (activityLog == null || string.IsNullOrEmpty(userId))
                return false;

            return activityLog.UserId.Equals(userId, StringComparison.OrdinalIgnoreCase);
        }

        /// <summary>
        /// Checks if the activity was performed by a user with the specified email
        /// </summary>
        /// <param name="activityLog">The activity log entry</param>
        /// <param name="email">Email to check</param>
        /// <returns>True if the activity was performed by a user with the specified email</returns>
        public static bool IsPerformedByEmail(this ActivityLogWithUserInfo activityLog, string email)
        {
            if (activityLog == null || string.IsNullOrEmpty(email))
                return false;

            return !string.IsNullOrEmpty(activityLog.UserEmail) && 
                   activityLog.UserEmail.Equals(email, StringComparison.OrdinalIgnoreCase);
        }

        /// <summary>
        /// Gets the time elapsed since the activity occurred
        /// </summary>
        /// <param name="activityLog">The activity log entry</param>
        /// <returns>TimeSpan representing the elapsed time</returns>
        public static TimeSpan GetTimeElapsed(this ActivityLogWithUserInfo activityLog)
        {
            if (activityLog == null)
                return TimeSpan.Zero;

            return DateTime.UtcNow - activityLog.Timestamp;
        }

        /// <summary>
        /// Gets a human-readable time elapsed string
        /// </summary>
        /// <param name="activityLog">The activity log entry</param>
        /// <returns>Human-readable time elapsed string</returns>
        public static string GetTimeElapsedString(this ActivityLogWithUserInfo activityLog)
        {
            if (activityLog == null)
                return string.Empty;

            var elapsed = activityLog.GetTimeElapsed();

            if (elapsed.TotalDays >= 1)
                return $"{(int)elapsed.TotalDays} day(s) ago";
            
            if (elapsed.TotalHours >= 1)
                return $"{(int)elapsed.TotalHours} hour(s) ago";
            
            if (elapsed.TotalMinutes >= 1)
                return $"{(int)elapsed.TotalMinutes} minute(s) ago";
            
            return "Just now";
        }

        /// <summary>
        /// Checks if the activity is recent (within the specified time span)
        /// </summary>
        /// <param name="activityLog">The activity log entry</param>
        /// <param name="timeSpan">Time span to check against</param>
        /// <returns>True if the activity is within the specified time span</returns>
        public static bool IsRecent(this ActivityLogWithUserInfo activityLog, TimeSpan timeSpan)
        {
            if (activityLog == null)
                return false;

            return activityLog.GetTimeElapsed() <= timeSpan;
        }

        /// <summary>
        /// Gets a CSS class name based on the activity status
        /// </summary>
        /// <param name="activityLog">The activity log entry</param>
        /// <returns>CSS class name for styling</returns>
        public static string GetStatusCssClass(this ActivityLogWithUserInfo activityLog)
        {
            if (activityLog == null)
                return "status-unknown";

            return activityLog.Status ? "status-success" : "status-error";
        }

        /// <summary>
        /// Gets a display-friendly status text
        /// </summary>
        /// <param name="activityLog">The activity log entry</param>
        /// <returns>Status text for display</returns>
        public static string GetStatusText(this ActivityLogWithUserInfo activityLog)
        {
            if (activityLog == null)
                return "Unknown";

            return activityLog.Status ? "Success" : "Failed";
        }
    }
} 