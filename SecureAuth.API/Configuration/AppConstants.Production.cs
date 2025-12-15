namespace SecureAuth.API.Configuration
{
    /// <summary>
    /// Production Environment Constants
    /// Used when ASPNETCORE_ENVIRONMENT = "Production"
    /// </summary>
    public static class AppConstantsProduction
    {
        // ============================================
        // DATABASE CONNECTION - PRODUCTION
        // ============================================
        public static class Database
        {
            public const string Server = "VMI2515837";
            public const string DatabaseName = "HiLCoEIdentityDB";
            public const string User = "sa";
            public const string Password = "Hilco@2025"; // CHANGE THIS PASSWORD!
            public const int ConnectTimeout = 60;
            public const int CommandTimeout = 60;
            public const int MaxPoolSize = 200;
            public const int MinPoolSize = 10;
            public const int ConnectionLifetime = 600;
            public const bool Encrypt = true; // SECURITY: Must be true in production
            public const bool TrustServerCertificate = true; // Set to true when SQL Server uses self-signed or untrusted SSL certificates

            public static string ConnectionString => 
                $"server={Server};database={DatabaseName}; User={User};Password={Password}; " +
                $"Connect Timeout={ConnectTimeout};Command Timeout={CommandTimeout};" +
                $"Max Pool Size={MaxPoolSize};Min Pool Size={MinPoolSize};" +
                $"Connection Lifetime={ConnectionLifetime};Encrypt={Encrypt};" +
                $"TrustServerCertificate={TrustServerCertificate};" +
                $"ApplicationIntent=ReadWrite;MultiSubnetFailover=False;Pooling=True;MultipleActiveResultSets=True;";
        }

        // ============================================
        // JWT CONFIGURATION - PRODUCTION
        // ============================================
        public static class Jwt
        {
            public const string ValidAudience = "https://staging.hilcoe.edu.et";
            public const string ValidIssuer = "https://hilcoe.edu.et:5001";
            // SECURITY: Change this to a strong random secret (64+ characters)
            public const string Secret = "JWTAuthenticationHIGHsecuredPasswordVVVp1OH7XzyrJWTAuthenticationHIGHsecuredPasswordVVVp1OH7Xzyr";
            public const int RefreshTokenValidity = 7; // days
        }

        // ============================================
        // APPLICATION SETTINGS - PRODUCTION
        // ============================================
        public static class AppSettings
        {
            public const string FrontendUrl = "https://staging.hilcoe.edu.et";
        }

        // ============================================
        // EMAIL CONFIGURATION - PRODUCTION
        // ============================================
        public static class Email
        {
            public const string From = "hilcoeregistrarsystemes@gmail.com";
            public const string SmtpServer = "smtp.gmail.com";
            public const int Port = 587;
            public const string Username = "hilcoeregistrarsystemes@gmail.com";
            // SECURITY: Change this password
            public const string Password = "szzkwggwgdbppvws";
            public const string BaseUrl = "https://hilcoe.edu.et:5001";
        }

        // ============================================
        // RATE LIMITING - PRODUCTION (Stricter)
        // ============================================
        public static class RateLimiting
        {
            public const int MaxAttempts = 300; // Stricter limit for production
            public const int TimeWindowMinutes = 15;
            public const bool EnablePerformanceMonitoring = true;
            public const int CleanupIntervalMinutes = 5;
        }

        // ============================================
        // TOKEN POLICY - PRODUCTION
        // ============================================
        public static class TokenPolicy
        {
            public const int AccessTokenValidity = 15; // Shorter for security (15 minutes)
            public const int RefreshTokenValidity = 7; // days
            public const bool RequireRefreshTokenRotation = true;
        }

        // ============================================
        // PASSWORD POLICY - PRODUCTION
        // ============================================
        public static class PasswordPolicy
        {
            public const int MinLength = 8;
            public const bool RequireUppercase = true;
            public const bool RequireLowercase = true;
            public const bool RequireDigit = true;
            public const bool RequireSpecialCharacter = true;
            public const int PasswordHistorySize = 5;
            public const int MaxAgeDays = 90;
        }

        // ============================================
        // OTP SETTINGS - PRODUCTION
        // ============================================
        public static class OtpSettings
        {
            public const bool Enabled = true;
            public const int ExpiryMinutes = 5;
            public const int ResendCooldownSeconds = 60;
            public const int MaxAttempts = 3;
            public const bool RequireForAllUsers = false;
        }

        // ============================================
        // SEED DATA - PRODUCTION
        // ============================================
        public static class SeedData
        {
            public const string SuperAdminEmail = "admin@hilcoe.edu.et";
            // SECURITY: Change this password
            public const string SuperAdminPassword = "ChangeThisPassword123!";
        }

        // ============================================
        // SWAGGER SETTINGS - PRODUCTION
        // ============================================
        public static class Swagger
        {
            public const bool Enabled = false; // Disabled in production for security
        }

        // ============================================
        // SECURITY SETTINGS - PRODUCTION
        // ============================================
        public static class Security
        {
            public const string FrontendClientKey = "HSCRS-2024-FRONTEND-SECURE-KEY-A7B9C3D5E8F1G2H4I6J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6";
        }

        // ============================================
        // CORS SETTINGS - PRODUCTION
        // ============================================
        public static class Cors
        {
            public static readonly string[] AllowedOrigins = new[]
            {
                "https://hilcoe.edu.et",
                "https://staging.hilcoe.edu.et",
                "https://hsis.hilcoe.edu.et",
                // Allow localhost for development frontend accessing production API
                "http://localhost:4200",
                "https://localhost:4200",
                "http://localhost:4201",
                "https://localhost:4201"
            };

            public static readonly string[] AllowedMethods = new[]
            {
                "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"
            };

            public static readonly string[] AllowedHeaders = new[]
            {
                "Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin", "X-CSRF-TOKEN", "X-Client-App"
            };
        }
    }
}

