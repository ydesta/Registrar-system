namespace SecureAuth.API.Configuration
{
    /// <summary>
    /// Main Application Constants - Automatically selects Development or Production
    /// Based on ASPNETCORE_ENVIRONMENT variable
    /// </summary>
    public static class AppConstants
    {
        private static readonly bool IsDevelopment = 
            System.Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development";

        // ============================================
        // DATABASE CONNECTION (Auto-selected)
        // ============================================
        public static class Database
        {
            public static string ConnectionString => IsDevelopment
                ? AppConstantsDevelopment.Database.ConnectionString
                : AppConstantsProduction.Database.ConnectionString;

            public static string Server => IsDevelopment
                ? AppConstantsDevelopment.Database.Server
                : AppConstantsProduction.Database.Server;

            public static string DatabaseName => IsDevelopment
                ? AppConstantsDevelopment.Database.DatabaseName
                : AppConstantsProduction.Database.DatabaseName;
        }

        // ============================================
        // JWT CONFIGURATION (Auto-selected)
        // ============================================
        public static class Jwt
        {
            public static string ValidAudience => IsDevelopment
                ? AppConstantsDevelopment.Jwt.ValidAudience
                : AppConstantsProduction.Jwt.ValidAudience;

            public static string ValidIssuer => IsDevelopment
                ? AppConstantsDevelopment.Jwt.ValidIssuer
                : AppConstantsProduction.Jwt.ValidIssuer;

            public static string Secret => IsDevelopment
                ? AppConstantsDevelopment.Jwt.Secret
                : AppConstantsProduction.Jwt.Secret;

            public static int RefreshTokenValidity => IsDevelopment
                ? AppConstantsDevelopment.Jwt.RefreshTokenValidity
                : AppConstantsProduction.Jwt.RefreshTokenValidity;
        }

        // ============================================
        // APPLICATION SETTINGS (Auto-selected)
        // ============================================
        public static class AppSettings
        {
            public static string FrontendUrl => IsDevelopment
                ? AppConstantsDevelopment.AppSettings.FrontendUrl
                : AppConstantsProduction.AppSettings.FrontendUrl;
        }

        // ============================================
        // EMAIL CONFIGURATION (Auto-selected)
        // ============================================
        public static class Email
        {
            public static string From => IsDevelopment
                ? AppConstantsDevelopment.Email.From
                : AppConstantsProduction.Email.From;

            public static string SmtpServer => IsDevelopment
                ? AppConstantsDevelopment.Email.SmtpServer
                : AppConstantsProduction.Email.SmtpServer;

            public static int Port => IsDevelopment
                ? AppConstantsDevelopment.Email.Port
                : AppConstantsProduction.Email.Port;

            public static string Username => IsDevelopment
                ? AppConstantsDevelopment.Email.Username
                : AppConstantsProduction.Email.Username;

            public static string Password => IsDevelopment
                ? AppConstantsDevelopment.Email.Password
                : AppConstantsProduction.Email.Password;

            public static string BaseUrl => IsDevelopment
                ? AppConstantsDevelopment.Email.BaseUrl
                : AppConstantsProduction.Email.BaseUrl;
        }

        // ============================================
        // RATE LIMITING (Auto-selected)
        // ============================================
        public static class RateLimiting
        {
            public static int MaxAttempts => IsDevelopment
                ? AppConstantsDevelopment.RateLimiting.MaxAttempts
                : AppConstantsProduction.RateLimiting.MaxAttempts;

            public static int TimeWindowMinutes => IsDevelopment
                ? AppConstantsDevelopment.RateLimiting.TimeWindowMinutes
                : AppConstantsProduction.RateLimiting.TimeWindowMinutes;

            public static bool EnablePerformanceMonitoring => IsDevelopment
                ? AppConstantsDevelopment.RateLimiting.EnablePerformanceMonitoring
                : AppConstantsProduction.RateLimiting.EnablePerformanceMonitoring;

            public static int CleanupIntervalMinutes => IsDevelopment
                ? AppConstantsDevelopment.RateLimiting.CleanupIntervalMinutes
                : AppConstantsProduction.RateLimiting.CleanupIntervalMinutes;
        }

        // ============================================
        // TOKEN POLICY (Auto-selected)
        // ============================================
        public static class TokenPolicy
        {
            public static int AccessTokenValidity => IsDevelopment
                ? AppConstantsDevelopment.TokenPolicy.AccessTokenValidity
                : AppConstantsProduction.TokenPolicy.AccessTokenValidity;

            public static int RefreshTokenValidity => IsDevelopment
                ? AppConstantsDevelopment.TokenPolicy.RefreshTokenValidity
                : AppConstantsProduction.TokenPolicy.RefreshTokenValidity;

            public static bool RequireRefreshTokenRotation => IsDevelopment
                ? AppConstantsDevelopment.TokenPolicy.RequireRefreshTokenRotation
                : AppConstantsProduction.TokenPolicy.RequireRefreshTokenRotation;
        }

        // ============================================
        // PASSWORD POLICY (Auto-selected)
        // ============================================
        public static class PasswordPolicy
        {
            public static int MinLength => IsDevelopment
                ? AppConstantsDevelopment.PasswordPolicy.MinLength
                : AppConstantsProduction.PasswordPolicy.MinLength;

            public static bool RequireUppercase => IsDevelopment
                ? AppConstantsDevelopment.PasswordPolicy.RequireUppercase
                : AppConstantsProduction.PasswordPolicy.RequireUppercase;

            public static bool RequireLowercase => IsDevelopment
                ? AppConstantsDevelopment.PasswordPolicy.RequireLowercase
                : AppConstantsProduction.PasswordPolicy.RequireLowercase;

            public static bool RequireDigit => IsDevelopment
                ? AppConstantsDevelopment.PasswordPolicy.RequireDigit
                : AppConstantsProduction.PasswordPolicy.RequireDigit;

            public static bool RequireSpecialCharacter => IsDevelopment
                ? AppConstantsDevelopment.PasswordPolicy.RequireSpecialCharacter
                : AppConstantsProduction.PasswordPolicy.RequireSpecialCharacter;

            public static int PasswordHistorySize => IsDevelopment
                ? AppConstantsDevelopment.PasswordPolicy.PasswordHistorySize
                : AppConstantsProduction.PasswordPolicy.PasswordHistorySize;

            public static int MaxAgeDays => IsDevelopment
                ? AppConstantsDevelopment.PasswordPolicy.MaxAgeDays
                : AppConstantsProduction.PasswordPolicy.MaxAgeDays;
        }

        // ============================================
        // OTP SETTINGS (Auto-selected)
        // ============================================
        public static class OtpSettings
        {
            public static bool Enabled => IsDevelopment
                ? AppConstantsDevelopment.OtpSettings.Enabled
                : AppConstantsProduction.OtpSettings.Enabled;

            public static int ExpiryMinutes => IsDevelopment
                ? AppConstantsDevelopment.OtpSettings.ExpiryMinutes
                : AppConstantsProduction.OtpSettings.ExpiryMinutes;

            public static int ResendCooldownSeconds => IsDevelopment
                ? AppConstantsDevelopment.OtpSettings.ResendCooldownSeconds
                : AppConstantsProduction.OtpSettings.ResendCooldownSeconds;

            public static int MaxAttempts => IsDevelopment
                ? AppConstantsDevelopment.OtpSettings.MaxAttempts
                : AppConstantsProduction.OtpSettings.MaxAttempts;

            public static bool RequireForAllUsers => IsDevelopment
                ? AppConstantsDevelopment.OtpSettings.RequireForAllUsers
                : AppConstantsProduction.OtpSettings.RequireForAllUsers;
        }

        // ============================================
        // SEED DATA (Auto-selected)
        // ============================================
        public static class SeedData
        {
            public static string SuperAdminEmail => IsDevelopment
                ? AppConstantsDevelopment.SeedData.SuperAdminEmail
                : AppConstantsProduction.SeedData.SuperAdminEmail;

            public static string SuperAdminPassword => IsDevelopment
                ? AppConstantsDevelopment.SeedData.SuperAdminPassword
                : AppConstantsProduction.SeedData.SuperAdminPassword;
        }

        // ============================================
        // SWAGGER SETTINGS (Auto-selected)
        // ============================================
        public static class Swagger
        {
            public static bool Enabled => IsDevelopment
                ? AppConstantsDevelopment.Swagger.Enabled
                : AppConstantsProduction.Swagger.Enabled;
        }

        // ============================================
        // SECURITY SETTINGS (Auto-selected)
        // ============================================
        public static class Security
        {
            public static string FrontendClientKey => IsDevelopment
                ? AppConstantsDevelopment.Security.FrontendClientKey
                : AppConstantsProduction.Security.FrontendClientKey;
        }

        // ============================================
        // CORS SETTINGS (Auto-selected)
        // ============================================
        public static class Cors
        {
            public static string[] AllowedOrigins => IsDevelopment
                ? AppConstantsDevelopment.Cors.AllowedOrigins
                : AppConstantsProduction.Cors.AllowedOrigins;

            public static string[] AllowedMethods => IsDevelopment
                ? AppConstantsDevelopment.Cors.AllowedMethods
                : AppConstantsProduction.Cors.AllowedMethods;

            public static string[] AllowedHeaders => IsDevelopment
                ? AppConstantsDevelopment.Cors.AllowedHeaders
                : AppConstantsProduction.Cors.AllowedHeaders;
        }

        // ============================================
        // ENVIRONMENT INFO
        // ============================================
        public static class Environment
        {
            public static bool IsDevelopmentEnvironment => IsDevelopment;
            public static bool IsProductionEnvironment => !IsDevelopment;
            public static string CurrentEnvironment => IsDevelopment ? "Development" : "Production";
        }
    }
}

