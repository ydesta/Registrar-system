using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using SecureAuth.DOMAIN.Models;
using SecureAuth.DOMAIN.Models.Security;

namespace SecureAuth.INFRASTRUCTURE.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, string,
        IdentityUserClaim<string>, IdentityUserRole<string>, IdentityUserLogin<string>,
        IdentityRoleClaim<string>, IdentityUserToken<string>>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        // Security-related DbSets
        public DbSet<PasswordResetToken> PasswordResetTokens { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<ActivityLog> ActivityLogs { get; set; }
        public DbSet<Permission> Permissions { get; set; }
        public DbSet<RolePermission> RolePermissions { get; set; }
        public DbSet<UserRoleAssignment> UserRoleAssignments { get; set; }
        public DbSet<PasswordHistory> PasswordHistories { get; set; }
        public DbSet<PasswordPolicy> PasswordPolicies { get; set; }

        // System-related DbSets
        public DbSet<SystemConfiguration> SystemConfigurations { get; set; }
        public DbSet<SystemBackup> SystemBackups { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<ServiceHealth> ServiceHealths { get; set; }
        public DbSet<DatabaseHealth> DatabaseHealths { get; set; }
        public DbSet<SystemMetrics> SystemMetrics { get; set; }

        // Security-related DbSets
        public DbSet<SecurityEvent> SecurityEvents { get; set; }
        public DbSet<SecurityThreat> SecurityThreats { get; set; }
        public DbSet<SecuritySettings> SecuritySettings { get; set; }
        public DbSet<UserCredential> UserCredential { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Rename Identity tables
            builder.Entity<ApplicationUser>().ToTable("Users");
            builder.Entity<ApplicationRole>().ToTable("Roles");
            builder.Entity<IdentityUserRole<string>>().ToTable("UserRoles");
            builder.Entity<IdentityUserClaim<string>>().ToTable("UserClaims");
            builder.Entity<IdentityUserLogin<string>>().ToTable("UserLogins");
            builder.Entity<IdentityRoleClaim<string>>().ToTable("RoleClaims");
            builder.Entity<IdentityUserToken<string>>().ToTable("UserTokens");
            builder.Entity<PasswordHistory>().ToTable("PasswordHistories");

            // Explicitly configure the RolePermission relationship
            builder.Entity<RolePermission>(b =>
            {
                b.HasKey(rp => new { rp.RoleId, rp.PermissionId });

                b.HasOne(rp => rp.Role)
                    .WithMany(r => r.RolePermissions)
                    .HasForeignKey(rp => rp.RoleId)
                    .IsRequired();

                b.HasOne(rp => rp.Permission)
                    .WithMany(p => p.RolePermissions)
                    .HasForeignKey(rp => rp.PermissionId)
                    .IsRequired();
            });

            // Configure composite key for PasswordHistory
            builder.Entity<PasswordHistory>()
                .HasKey(ph => new { ph.UserId, ph.PasswordHash });

            // Configure ApplicationUser
            builder.Entity<ApplicationUser>(entity =>
            {
                entity.Property(e => e.FirstName).IsRequired().HasMaxLength(50);
                entity.Property(e => e.LastName).IsRequired().HasMaxLength(50);
                entity.Property(e => e.CreatedAt).IsRequired();
                entity.Property(e => e.IsActive).IsRequired();
                entity.Property(e => e.FailedLoginAttempts).IsRequired();
                entity.Property(e => e.CreatedAt)
                    .HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.UpdatedAt)
                    .HasDefaultValueSql("GETUTCDATE()");

                // Add performance indexes for user queries
                entity.HasIndex(e => e.IsActive).HasDatabaseName("IX_Users_IsActive");
                entity.HasIndex(e => e.CreatedAt).HasDatabaseName("IX_Users_CreatedAt");
                entity.HasIndex(e => e.LastLoginAt).HasDatabaseName("IX_Users_LastLoginAt");
                entity.HasIndex(e => e.FirstName).HasDatabaseName("IX_Users_FirstName");
                entity.HasIndex(e => e.LastName).HasDatabaseName("IX_Users_LastName");
                entity.HasIndex(e => e.Email).HasDatabaseName("IX_Users_Email");
                entity.HasIndex(e => e.PhoneNumber).HasDatabaseName("IX_Users_PhoneNumber");
                
                // Composite index for search queries
                entity.HasIndex(e => new { e.FirstName, e.LastName, e.Email, e.PhoneNumber })
                    .HasDatabaseName("IX_Users_Search");
            });

            // Configure PasswordResetToken
            builder.Entity<PasswordResetToken>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Token).IsRequired();
                entity.Property(e => e.ExpiresAt).IsRequired();
                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure RefreshToken
            builder.Entity<RefreshToken>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.UserId).IsRequired();
                entity.Property(e => e.Token).IsRequired();
                entity.Property(e => e.ExpiresAt).IsRequired();
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure ActivityLog
            builder.Entity<ActivityLog>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Action).IsRequired().HasMaxLength(100);
                entity.Property(e => e.EntityType).IsRequired().HasMaxLength(100);
                entity.Property(e => e.EntityId).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Details).HasMaxLength(1000);
                entity.Property(e => e.IpAddress).HasMaxLength(50);
                entity.Property(e => e.UserAgent).HasMaxLength(500);
                entity.Property(e => e.ErrorMessage).HasMaxLength(1000);
                entity.Property(e => e.Timestamp).HasDefaultValueSql("GETUTCDATE()");
                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure Permission
            builder.Entity<Permission>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Description).HasMaxLength(500);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            });

            // Configure UserRoleAssignment
            builder.Entity<UserRoleAssignment>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.UserId).IsRequired();
                entity.Property(e => e.RoleId).IsRequired();
                entity.Property(e => e.AssignedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.IsActive).HasDefaultValue(true);
                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.AssignedByUser)
                    .WithMany()
                    .HasForeignKey(e => e.AssignedBy)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure PasswordHistory
            builder.Entity<PasswordHistory>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.UserId).IsRequired();
                entity.Property(e => e.PasswordHash).IsRequired();
                entity.Property(e => e.ChangedBy).IsRequired();
                entity.Property(e => e.ChangeReason).IsRequired();
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure PasswordPolicy
            builder.Entity<PasswordPolicy>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.MinLength).IsRequired();
                entity.Property(e => e.RequireUppercase).IsRequired();
                entity.Property(e => e.RequireLowercase).IsRequired();
                entity.Property(e => e.RequireDigit).IsRequired();
                entity.Property(e => e.RequireSpecialCharacter).IsRequired();
                entity.Property(e => e.MaxAgeDays).IsRequired();
                entity.Property(e => e.HistoryCount).IsRequired();
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            });

            // Configure SystemConfiguration
            builder.Entity<SystemConfiguration>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Key).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Value).IsRequired().HasMaxLength(1000);
                entity.Property(e => e.Description).HasMaxLength(500);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
            });

            // Configure SystemBackup
            builder.Entity<SystemBackup>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.BackupType).IsRequired().HasMaxLength(50);
                entity.Property(e => e.FilePath).IsRequired().HasMaxLength(500);
                entity.Property(e => e.FileSize).IsRequired();
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            });

            // Configure AuditLog
            builder.Entity<AuditLog>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Action).IsRequired().HasMaxLength(100);
                entity.Property(e => e.EntityType).IsRequired().HasMaxLength(100);
                entity.Property(e => e.EntityId).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Details).HasMaxLength(1000);
                entity.Property(e => e.IpAddress).HasMaxLength(50);
                entity.Property(e => e.UserAgent).HasMaxLength(500);
                entity.Property(e => e.Timestamp).HasDefaultValueSql("GETUTCDATE()");
            });

            // Configure ServiceHealth
            builder.Entity<ServiceHealth>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.ServiceName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
                entity.Property(e => e.ResponseTime).IsRequired();
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            });

            // Configure DatabaseHealth
            builder.Entity<DatabaseHealth>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
                entity.Property(e => e.ResponseTime).IsRequired();
                entity.Property(e => e.ActiveConnections).IsRequired();
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            });

            // Configure SystemMetrics
            builder.Entity<SystemMetrics>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.MetricType).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Value).IsRequired().HasColumnType("float");
                entity.Property(e => e.Timestamp).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.Unit).HasMaxLength(100);
                entity.Property(e => e.Description).HasMaxLength(500);
            });

            // Configure SecurityEvent
            builder.Entity<SecurityEvent>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.EventType).IsRequired().HasMaxLength(100);
                entity.Property(e => e.UserId).IsRequired();
                entity.Property(e => e.Severity).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Description).HasMaxLength(1000);
                entity.Property(e => e.IpAddress).HasMaxLength(50);
                entity.Property(e => e.UserAgent).HasMaxLength(500);
                entity.Property(e => e.Timestamp).HasDefaultValueSql("GETUTCDATE()");
            });

            // Configure SecurityThreat
            builder.Entity<SecurityThreat>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.ThreatType).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Severity).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Description).HasMaxLength(1000);
                entity.Property(e => e.SourceIp).HasMaxLength(50);
                entity.Property(e => e.UserAgent).HasMaxLength(500);
                entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            });

            // Configure SecuritySettings
            builder.Entity<SecuritySettings>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Key).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Value).IsRequired().HasMaxLength(1000);
                entity.Property(e => e.Description).HasMaxLength(500);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
            });
        }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            var entries = ChangeTracker.Entries<ApplicationUser>()
                .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified);

            foreach (var entry in entries)
            {
                if (entry.State == EntityState.Added)
                {
                    entry.Entity.CreatedAt = DateTime.UtcNow;
                }
                entry.Entity.UpdatedAt = DateTime.UtcNow;
            }

            return await base.SaveChangesAsync(cancellationToken);
        }

        public override int SaveChanges()
        {
            var entries = ChangeTracker.Entries<ApplicationUser>()
                .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified);

            foreach (var entry in entries)
            {
                if (entry.State == EntityState.Added)
                {
                    entry.Entity.CreatedAt = DateTime.UtcNow;
                }
                entry.Entity.UpdatedAt = DateTime.UtcNow;
            }

            return base.SaveChanges();
        }
    }
} 
