namespace SecureAuth.DOMAIN.Enums
{
    public enum SystemActivityType
    {
        // Authentication Activities
        UserLogin = 1,
        UserLogout = 2,
        LoginFailed = 3,
        PasswordChanged = 4,
        PasswordResetRequested = 5,
        PasswordResetCompleted = 6,
        AccountLocked = 7,
        AccountUnlocked = 8,
        
        // Profile Activities
        ProfileUpdated = 9,
        EmailChanged = 10,
        PhoneNumberChanged = 11,
        
        // Role & Permission Activities
        RoleAssigned = 12,
        RoleRemoved = 13,
        PermissionGranted = 14,
        PermissionRevoked = 15,
        
        // Security Activities
        TwoFactorEnabled = 16,
        TwoFactorDisabled = 17,
        SecurityQuestionsUpdated = 18,
        SessionExpired = 19,
        
        // System Activities
        SystemStartup = 20,
        SystemShutdown = 21,
        ConfigurationChanged = 22,
        DatabaseBackup = 23,
        DatabaseRestore = 24
    }
} 