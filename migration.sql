IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
CREATE TABLE [AuditLogs] (
    [Id] nvarchar(450) NOT NULL,
    [UserId] nvarchar(max) NOT NULL,
    [Action] nvarchar(100) NOT NULL,
    [EntityType] nvarchar(100) NOT NULL,
    [EntityId] nvarchar(100) NOT NULL,
    [Details] nvarchar(1000) NULL,
    [IpAddress] nvarchar(50) NULL,
    [UserAgent] nvarchar(500) NULL,
    [Timestamp] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
    [Status] bit NOT NULL,
    [ErrorMessage] nvarchar(1000) NULL,
    CONSTRAINT [PK_AuditLogs] PRIMARY KEY ([Id])
);

CREATE TABLE [DatabaseHealths] (
    [Id] nvarchar(450) NOT NULL,
    [Status] nvarchar(50) NOT NULL,
    [Timestamp] datetime2 NOT NULL,
    [ResponseTime] int NOT NULL,
    [ActiveConnections] int NOT NULL,
    [ErrorMessage] nvarchar(1000) NULL,
    [Details] nvarchar(500) NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
    CONSTRAINT [PK_DatabaseHealths] PRIMARY KEY ([Id])
);

CREATE TABLE [PasswordPolicies] (
    [Id] nvarchar(450) NOT NULL,
    [MinLength] int NOT NULL,
    [RequireUppercase] bit NOT NULL,
    [RequireLowercase] bit NOT NULL,
    [RequireDigit] bit NOT NULL,
    [RequireSpecialCharacter] bit NOT NULL,
    [MaxFailedAttempts] int NOT NULL,
    [LockoutDuration] int NOT NULL,
    [PasswordHistorySize] int NOT NULL,
    [MaxAgeDays] int NOT NULL,
    [PreventCommonPasswords] bit NOT NULL,
    [HistoryCount] int NOT NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
    CONSTRAINT [PK_PasswordPolicies] PRIMARY KEY ([Id])
);

CREATE TABLE [Permissions] (
    [Id] nvarchar(450) NOT NULL,
    [Name] nvarchar(100) NOT NULL,
    [Description] nvarchar(500) NULL,
    [Category] nvarchar(50) NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
    CONSTRAINT [PK_Permissions] PRIMARY KEY ([Id])
);

CREATE TABLE [Roles] (
    [Id] nvarchar(450) NOT NULL,
    [Name] nvarchar(256) NULL,
    [NormalizedName] nvarchar(256) NULL,
    [ConcurrencyStamp] nvarchar(max) NULL,
    CONSTRAINT [PK_Roles] PRIMARY KEY ([Id])
);

CREATE TABLE [SecuritySettings] (
    [Id] nvarchar(450) NOT NULL,
    [Key] nvarchar(100) NOT NULL,
    [Value] nvarchar(1000) NOT NULL,
    [Description] nvarchar(500) NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
    [UpdatedAt] datetime2 NULL DEFAULT (GETUTCDATE()),
    [UpdatedBy] nvarchar(100) NULL,
    [IsActive] bit NOT NULL,
    CONSTRAINT [PK_SecuritySettings] PRIMARY KEY ([Id])
);

CREATE TABLE [SecurityThreats] (
    [Id] nvarchar(450) NOT NULL,
    [ThreatType] nvarchar(100) NOT NULL,
    [Status] nvarchar(50) NOT NULL,
    [Severity] nvarchar(50) NOT NULL,
    [Description] nvarchar(1000) NULL,
    [SourceIp] nvarchar(50) NULL,
    [UserAgent] nvarchar(500) NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
    [ResolvedAt] datetime2 NULL,
    [ResolvedBy] nvarchar(100) NULL,
    [ResolutionNotes] nvarchar(1000) NULL,
    [IsActive] bit NOT NULL,
    CONSTRAINT [PK_SecurityThreats] PRIMARY KEY ([Id])
);

CREATE TABLE [ServiceHealths] (
    [Id] nvarchar(450) NOT NULL,
    [ServiceName] nvarchar(100) NOT NULL,
    [Status] nvarchar(50) NOT NULL,
    [Timestamp] datetime2 NOT NULL,
    [ResponseTime] int NOT NULL,
    [ErrorMessage] nvarchar(1000) NULL,
    [Details] nvarchar(500) NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
    CONSTRAINT [PK_ServiceHealths] PRIMARY KEY ([Id])
);

CREATE TABLE [SystemBackups] (
    [Id] nvarchar(450) NOT NULL,
    [BackupFileName] nvarchar(200) NOT NULL,
    [Description] nvarchar(500) NULL,
    [BackupType] nvarchar(50) NOT NULL,
    [FileSize] bigint NOT NULL,
    [FilePath] nvarchar(500) NOT NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
    [CreatedBy] nvarchar(100) NULL,
    [IsEncrypted] bit NOT NULL,
    [EncryptionKey] nvarchar(max) NULL,
    [ExpiresAt] datetime2 NULL,
    [IsActive] bit NOT NULL,
    CONSTRAINT [PK_SystemBackups] PRIMARY KEY ([Id])
);

CREATE TABLE [SystemConfigurations] (
    [Id] nvarchar(450) NOT NULL,
    [Key] nvarchar(100) NOT NULL,
    [Value] nvarchar(1000) NOT NULL,
    [Description] nvarchar(500) NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
    [UpdatedAt] datetime2 NULL DEFAULT (GETUTCDATE()),
    [UpdatedBy] nvarchar(100) NULL,
    [IsActive] bit NOT NULL,
    CONSTRAINT [PK_SystemConfigurations] PRIMARY KEY ([Id])
);

CREATE TABLE [SystemMetrics] (
    [Id] nvarchar(450) NOT NULL,
    [MetricType] nvarchar(50) NOT NULL,
    [Value] float NOT NULL,
    [Timestamp] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
    [Unit] nvarchar(100) NULL,
    [Description] nvarchar(500) NULL,
    CONSTRAINT [PK_SystemMetrics] PRIMARY KEY ([Id])
);

CREATE TABLE [Users] (
    [Id] nvarchar(450) NOT NULL,
    [FirstName] nvarchar(50) NOT NULL,
    [MiddleName] nvarchar(50) NULL,
    [LastName] nvarchar(50) NOT NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
    [LastLoginAt] datetime2 NULL,
    [IsActive] bit NOT NULL,
    [FailedLoginAttempts] int NOT NULL,
    [LockoutEnd] datetimeoffset NULL,
    [UpdatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
    [PasswordChangedAt] datetime2 NULL,
    [LastLoginDate] datetime2 NULL,
    [PasswordChangedDate] datetime2 NULL,
    [RefreshToken] nvarchar(max) NULL,
    [RefreshTokenExpiry] datetime2 NULL,
    [UserName] nvarchar(256) NULL,
    [NormalizedUserName] nvarchar(256) NULL,
    [Email] nvarchar(256) NULL,
    [NormalizedEmail] nvarchar(256) NULL,
    [EmailConfirmed] bit NOT NULL,
    [PasswordHash] nvarchar(max) NULL,
    [SecurityStamp] nvarchar(max) NULL,
    [ConcurrencyStamp] nvarchar(max) NULL,
    [PhoneNumber] nvarchar(max) NULL,
    [PhoneNumberConfirmed] bit NOT NULL,
    [TwoFactorEnabled] bit NOT NULL,
    [LockoutEnabled] bit NOT NULL,
    [AccessFailedCount] int NOT NULL,
    CONSTRAINT [PK_Users] PRIMARY KEY ([Id])
);

CREATE TABLE [RoleClaims] (
    [Id] int NOT NULL IDENTITY,
    [RoleId] nvarchar(450) NOT NULL,
    [ClaimType] nvarchar(max) NULL,
    [ClaimValue] nvarchar(max) NULL,
    CONSTRAINT [PK_RoleClaims] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_RoleClaims_Roles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [Roles] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [RolePermissions] (
    [RoleId] nvarchar(450) NOT NULL,
    [PermissionId] nvarchar(450) NOT NULL,
    [AssignedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_RolePermissions] PRIMARY KEY ([RoleId], [PermissionId]),
    CONSTRAINT [FK_RolePermissions_Permissions_PermissionId] FOREIGN KEY ([PermissionId]) REFERENCES [Permissions] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_RolePermissions_Roles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [Roles] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [ActivityLogs] (
    [Id] nvarchar(450) NOT NULL,
    [UserId] nvarchar(450) NOT NULL,
    [Action] nvarchar(100) NOT NULL,
    [EntityType] nvarchar(100) NOT NULL,
    [EntityId] nvarchar(100) NOT NULL,
    [Details] nvarchar(1000) NULL,
    [IpAddress] nvarchar(50) NULL,
    [UserAgent] nvarchar(500) NULL,
    [Timestamp] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
    [Status] bit NOT NULL,
    [ErrorMessage] nvarchar(1000) NULL,
    CONSTRAINT [PK_ActivityLogs] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_ActivityLogs_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [PasswordHistories] (
    [Id] nvarchar(450) NOT NULL,
    [UserId] nvarchar(450) NOT NULL,
    [PasswordHash] nvarchar(max) NOT NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
    [ChangedBy] nvarchar(max) NOT NULL,
    [ChangeReason] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_PasswordHistories] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_PasswordHistories_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [PasswordResetTokens] (
    [Id] int NOT NULL IDENTITY,
    [UserId] nvarchar(450) NOT NULL,
    [Token] nvarchar(max) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [ExpiresAt] datetime2 NOT NULL,
    [IsUsed] bit NOT NULL,
    [UsedAt] datetime2 NULL,
    CONSTRAINT [PK_PasswordResetTokens] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_PasswordResetTokens_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [RefreshTokens] (
    [Id] nvarchar(450) NOT NULL,
    [UserId] nvarchar(450) NOT NULL,
    [Token] nvarchar(max) NOT NULL,
    [ExpiresAt] datetime2 NOT NULL,
    [CreatedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
    [CreatedByIp] nvarchar(max) NULL,
    [RevokedAt] datetime2 NULL,
    [RevokedByIp] nvarchar(max) NULL,
    [ReplacedByToken] nvarchar(max) NULL,
    [ReasonRevoked] nvarchar(max) NULL,
    CONSTRAINT [PK_RefreshTokens] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_RefreshTokens_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [SecurityEvents] (
    [Id] nvarchar(450) NOT NULL,
    [UserId] nvarchar(450) NOT NULL,
    [EventType] nvarchar(100) NOT NULL,
    [Severity] nvarchar(50) NOT NULL,
    [Description] nvarchar(1000) NULL,
    [IpAddress] nvarchar(50) NULL,
    [UserAgent] nvarchar(500) NULL,
    [Timestamp] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
    [IsResolved] bit NOT NULL,
    [ResolutionNotes] nvarchar(1000) NULL,
    CONSTRAINT [PK_SecurityEvents] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_SecurityEvents_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [UserClaims] (
    [Id] int NOT NULL IDENTITY,
    [UserId] nvarchar(450) NOT NULL,
    [ClaimType] nvarchar(max) NULL,
    [ClaimValue] nvarchar(max) NULL,
    CONSTRAINT [PK_UserClaims] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_UserClaims_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [UserLogins] (
    [LoginProvider] nvarchar(450) NOT NULL,
    [ProviderKey] nvarchar(450) NOT NULL,
    [ProviderDisplayName] nvarchar(max) NULL,
    [UserId] nvarchar(450) NOT NULL,
    CONSTRAINT [PK_UserLogins] PRIMARY KEY ([LoginProvider], [ProviderKey]),
    CONSTRAINT [FK_UserLogins_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [UserRoleAssignments] (
    [Id] nvarchar(450) NOT NULL,
    [UserId] nvarchar(450) NOT NULL,
    [RoleId] nvarchar(450) NOT NULL,
    [AssignedAt] datetime2 NOT NULL DEFAULT (GETUTCDATE()),
    [AssignedBy] nvarchar(450) NULL,
    [ExpiresAt] datetime2 NULL,
    [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
    CONSTRAINT [PK_UserRoleAssignments] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_UserRoleAssignments_Roles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [Roles] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_UserRoleAssignments_Users_AssignedBy] FOREIGN KEY ([AssignedBy]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_UserRoleAssignments_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [UserRoles] (
    [UserId] nvarchar(450) NOT NULL,
    [RoleId] nvarchar(450) NOT NULL,
    CONSTRAINT [PK_UserRoles] PRIMARY KEY ([UserId], [RoleId]),
    CONSTRAINT [FK_UserRoles_Roles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [Roles] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_UserRoles_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [UserTokens] (
    [UserId] nvarchar(450) NOT NULL,
    [LoginProvider] nvarchar(450) NOT NULL,
    [Name] nvarchar(450) NOT NULL,
    [Value] nvarchar(max) NULL,
    CONSTRAINT [PK_UserTokens] PRIMARY KEY ([UserId], [LoginProvider], [Name]),
    CONSTRAINT [FK_UserTokens_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);

CREATE INDEX [IX_ActivityLogs_Timestamp] ON [ActivityLogs] ([Timestamp]);
CREATE INDEX [IX_ActivityLogs_UserId] ON [ActivityLogs] ([UserId]);
CREATE INDEX [IX_ActivityLogs_Action] ON [ActivityLogs] ([Action]);
CREATE INDEX [IX_ActivityLogs_EntityType] ON [ActivityLogs] ([EntityType]);
CREATE INDEX [IX_ActivityLogs_Status] ON [ActivityLogs] ([Status]);
CREATE INDEX [IX_ActivityLogs_IpAddress] ON [ActivityLogs] ([IpAddress]);

-- Composite indexes for common query patterns
CREATE INDEX [IX_ActivityLogs_UserId_Timestamp] ON [ActivityLogs] ([UserId], [Timestamp]);
CREATE INDEX [IX_ActivityLogs_Action_Timestamp] ON [ActivityLogs] ([Action], [Timestamp]);
CREATE INDEX [IX_ActivityLogs_EntityType_Timestamp] ON [ActivityLogs] ([EntityType], [Timestamp]);
CREATE INDEX [IX_ActivityLogs_Status_Timestamp] ON [ActivityLogs] ([Status], [Timestamp]);

-- Index for date range queries
CREATE INDEX [IX_ActivityLogs_Timestamp_Action] ON [ActivityLogs] ([Timestamp], [Action]);

CREATE INDEX [IX_PasswordHistories_UserId] ON [PasswordHistories] ([UserId]);

CREATE INDEX [IX_PasswordResetTokens_UserId] ON [PasswordResetTokens] ([UserId]);

CREATE INDEX [IX_RefreshTokens_UserId] ON [RefreshTokens] ([UserId]);

CREATE INDEX [IX_RoleClaims_RoleId] ON [RoleClaims] ([RoleId]);

CREATE INDEX [IX_RolePermissions_PermissionId] ON [RolePermissions] ([PermissionId]);

CREATE UNIQUE INDEX [RoleNameIndex] ON [Roles] ([NormalizedName]) WHERE [NormalizedName] IS NOT NULL;

CREATE INDEX [IX_SecurityEvents_UserId] ON [SecurityEvents] ([UserId]);

CREATE INDEX [IX_UserClaims_UserId] ON [UserClaims] ([UserId]);

CREATE INDEX [IX_UserLogins_UserId] ON [UserLogins] ([UserId]);

CREATE INDEX [IX_UserRoleAssignments_AssignedBy] ON [UserRoleAssignments] ([AssignedBy]);

CREATE INDEX [IX_UserRoleAssignments_RoleId] ON [UserRoleAssignments] ([RoleId]);

CREATE INDEX [IX_UserRoleAssignments_UserId] ON [UserRoleAssignments] ([UserId]);

CREATE INDEX [IX_UserRoles_RoleId] ON [UserRoles] ([RoleId]);

CREATE INDEX [EmailIndex] ON [Users] ([NormalizedEmail]);

CREATE UNIQUE INDEX [UserNameIndex] ON [Users] ([NormalizedUserName]) WHERE [NormalizedUserName] IS NOT NULL;

-- Add performance indexes for Users table
CREATE INDEX [IX_Users_IsActive] ON [Users] ([IsActive]);
CREATE INDEX [IX_Users_CreatedAt] ON [Users] ([CreatedAt]);
CREATE INDEX [IX_Users_LastLoginAt] ON [Users] ([LastLoginAt]);
CREATE INDEX [IX_Users_FirstName] ON [Users] ([FirstName]);
CREATE INDEX [IX_Users_LastName] ON [Users] ([LastName]);
CREATE INDEX [IX_Users_Email] ON [Users] ([Email]);
CREATE INDEX [IX_Users_PhoneNumber] ON [Users] ([PhoneNumber]);

-- Composite index for search queries
CREATE INDEX [IX_Users_Search] ON [Users] ([FirstName], [LastName], [Email], [PhoneNumber]);

-- Add index for UserRoles to improve role filtering
CREATE INDEX [IX_UserRoles_UserId] ON [UserRoles] ([UserId]);
CREATE INDEX [IX_UserRoles_RoleId] ON [UserRoles] ([RoleId]);

-- Add composite index for UserRoles to improve role-based queries
CREATE INDEX [IX_UserRoles_UserId_RoleId] ON [UserRoles] ([UserId], [RoleId]);

-- Add performance indexes for login-related queries
CREATE INDEX [IX_Users_Email] ON [Users] ([Email]);
CREATE INDEX [IX_Users_UserName] ON [Users] ([UserName]);
CREATE INDEX [IX_Users_IsActive] ON [Users] ([IsActive]);
CREATE INDEX [IX_Users_EmailConfirmed] ON [Users] ([EmailConfirmed]);
CREATE INDEX [IX_Users_TwoFactorEnabled] ON [Users] ([TwoFactorEnabled]);
CREATE INDEX [IX_Users_LockoutEnd] ON [Users] ([LockoutEnd]);
CREATE INDEX [IX_Users_FailedLoginAttempts] ON [Users] ([FailedLoginAttempts]);

-- Indexes for UserRoles table (login performance)
CREATE INDEX [IX_UserRoles_UserId] ON [UserRoles] ([UserId]);
CREATE INDEX [IX_UserRoles_RoleId] ON [UserRoles] ([RoleId]);
CREATE INDEX [IX_UserRoles_UserId_RoleId] ON [UserRoles] ([UserId], [RoleId]);

-- Indexes for RolePermissions table (login performance)
CREATE INDEX [IX_RolePermissions_RoleId] ON [RolePermissions] ([RoleId]);
CREATE INDEX [IX_RolePermissions_PermissionId] ON [RolePermissions] ([PermissionId]);
CREATE INDEX [IX_RolePermissions_RoleId_PermissionId] ON [RolePermissions] ([RoleId], [PermissionId]);

-- Indexes for Permissions table
CREATE INDEX [IX_Permissions_Name] ON [Permissions] ([Name]);

-- Indexes for Roles table
CREATE INDEX [IX_Roles_Name] ON [Roles] ([Name]);
CREATE INDEX [IX_Roles_NormalizedName] ON [Roles] ([NormalizedName]);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20250623200755_UpdateSystemEntities', N'9.0.6');

COMMIT;
GO

