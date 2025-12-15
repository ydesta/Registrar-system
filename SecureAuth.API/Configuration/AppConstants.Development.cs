namespace SecureAuth.API.Configuration
{
    /// <summary>
    /// Development Environment Constants
    /// Used when ASPNETCORE_ENVIRONMENT = "Development"
    /// </summary>
    public static class AppConstantsDevelopment
    {
        // ============================================
        // DATABASE CONNECTION - DEVELOPMENT
        // ============================================
        public static class Database
        {
            public const string Server = "ASK"; // Your development server
            public const string DatabaseName = "HiLCoEIdentityDB";
            public const string User = ""; // Use Windows Authentication in dev
            public const string Password = ""; // Not needed for Windows Auth
            public const int ConnectTimeout = 3600;
            public const int CommandTimeout = 3600;
            public const int MaxPoolSize = 200;
            public const int MinPoolSize = 10;
            public const int ConnectionLifetime = 600;
            public const bool Encrypt = false; // Can be false in dev
            public const bool TrustServerCertificate = true; // OK for dev

            public static string ConnectionString => 
                $"Data Source={Server};Initial Catalog={DatabaseName};" +
                $"TrustServerCertificate={TrustServerCertificate.ToString().ToLower()};" +
                $"Trusted_Connection=true;Integrated Security=True;" +
                $"Connection Timeout={ConnectTimeout}";
        }

        // ============================================
        // JWT CONFIGURATION - DEVELOPMENT
        // ============================================
        public static class Jwt
        {
            public const string ValidAudience = "http://localhost:4200";
            public const string ValidIssuer = "https://localhost:7123";
            // Development secret - can be simpler
            public const string Secret = "YourVerySecretKeyMustBeAtLeast64CharactersForHMACSHA512Security!YourVerySecretKeyMustBeAtLeast64CharactersForHMACSHA512Security!";
            public const int RefreshTokenValidity = 7; // days
        }

        // ============================================
        // APPLICATION SETTINGS - DEVELOPMENT
        // ============================================
        public static class AppSettings
        {
            public const string FrontendUrl = "http://localhost:4200";
        }

        // ============================================
        // EMAIL CONFIGURATION - DEVELOPMENT
        // ============================================
        public static class Email
        {
            public const string From = "hilcoeregistrarsystem@gmail.com";
            public const string SmtpServer = "smtp.gmail.com";
            public const int Port = 587;
            public const string Username = "hilcoeregistrarsystem@gmail.com";
            public const string Password = "eaxfhyikdusxmeyz"; // Dev email password
            public const string BaseUrl = "https://localhost:7123";
        }

        // ============================================
        // RATE LIMITING - DEVELOPMENT (More Permissive)
        // ============================================
        public static class RateLimiting
        {
            public const int MaxAttempts = 1000; // Higher limit for dev
            public const int TimeWindowMinutes = 15;
            public const bool EnablePerformanceMonitoring = true;
            public const int CleanupIntervalMinutes = 5;
        }

        // ============================================
        // TOKEN POLICY - DEVELOPMENT
        // ============================================
        public static class TokenPolicy
        {
            public const int AccessTokenValidity = 60; // Longer for dev (60 minutes)
            public const int RefreshTokenValidity = 7; // days
            public const bool RequireRefreshTokenRotation = true;
        }

        // ============================================
        // PASSWORD POLICY - DEVELOPMENT
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
        // OTP SETTINGS - DEVELOPMENT
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
        // SEED DATA - DEVELOPMENT
        // ============================================
        public static class SeedData
        {
            public const string SuperAdminEmail = "admin@hilcoe.edu.et";
            public const string SuperAdminPassword = "DevPassword123!"; // Change this
        }

        // ============================================
        // SWAGGER SETTINGS - DEVELOPMENT
        // ============================================
        public static class Swagger
        {
            public const bool Enabled = true; // Enabled in development
        }

        // ============================================
        // SECURITY SETTINGS - DEVELOPMENT
        // ============================================
        public static class Security
        {
            public const string FrontendClientKey = "HSCRS-2024-FRONTEND-SECURE-KEY-A7B9C3D5E8F1G2H4I6J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6";
        }

        // ============================================
        // CORS SETTINGS - DEVELOPMENT
        // ============================================
        public static class Cors
        {
            public static readonly string[] AllowedOrigins = new[]
            {
                "http://localhost:4200",
                "https://localhost:4200",
                "http://localhost:4201",
                "https://localhost:4201"
            };

            public static readonly string[] AllowedMethods = new[]
            {
                "GET", "POST", "PUT", "DELETE", "OPTIONS"
            };

            public static readonly string[] AllowedHeaders = new[]
            {
                "Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin", "X-CSRF-TOKEN", "X-Client-App"
            };
        }
    }
}

