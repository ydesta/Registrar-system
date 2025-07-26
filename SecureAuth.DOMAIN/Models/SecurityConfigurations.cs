namespace SecureAuth.DOMAIN.Models.Security
{
    public class TokenPolicy
    {
        public int AccessTokenValidity { get; set; }
        public int RefreshTokenValidity { get; set; }
        public bool RequireRefreshTokenRotation { get; set; }
    }

    public class RateLimitingPolicy
    {
        public int MaxAttempts { get; set; }
        public int TimeWindowMinutes { get; set; }
    }
} 