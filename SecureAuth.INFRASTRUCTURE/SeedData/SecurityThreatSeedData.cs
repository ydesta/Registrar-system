using SecureAuth.DOMAIN.Models;
using SecureAuth.DOMAIN.Models.Security;

namespace SecureAuth.INFRASTRUCTURE.SeedData
{
    public static class SecurityThreatSeedData
    {
        public static List<SecurityThreat> GetSecurityThreats()
        {
            return new List<SecurityThreat>
            {
                new SecurityThreat
                {
                    Id = Guid.NewGuid().ToString(),
                    ThreatType = "Brute Force Attack",
                    Severity = "High",
                    Status = "Active",
                    Description = "Multiple failed login attempts detected from IP address 192.168.1.100",
                    SourceIp = "192.168.1.100",
                    UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    CreatedAt = DateTime.UtcNow.AddHours(-2),
                    IsActive = true
                },
                new SecurityThreat
                {
                    Id = Guid.NewGuid().ToString(),
                    ThreatType = "SQL Injection Attempt",
                    Severity = "High",
                    Status = "Active",
                    Description = "Potential SQL injection detected in login form",
                    SourceIp = "203.0.113.45",
                    UserAgent = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
                    CreatedAt = DateTime.UtcNow.AddHours(-1),
                    IsActive = true
                },
                new SecurityThreat
                {
                    Id = Guid.NewGuid().ToString(),
                    ThreatType = "Suspicious Activity",
                    Severity = "Medium",
                    Status = "Active",
                    Description = "Unusual access pattern detected for user account",
                    SourceIp = "198.51.100.23",
                    UserAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
                    CreatedAt = DateTime.UtcNow.AddMinutes(-30),
                    IsActive = true
                },
                new SecurityThreat
                {
                    Id = Guid.NewGuid().ToString(),
                    ThreatType = "XSS Attempt",
                    Severity = "Medium",
                    Status = "Resolved",
                    Description = "Cross-site scripting attempt detected in comment field",
                    SourceIp = "172.16.0.15",
                    UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    CreatedAt = DateTime.UtcNow.AddDays(-1),
                    ResolvedAt = DateTime.UtcNow.AddHours(-12),
                    ResolvedBy = "admin@secureauth.com",
                    ResolutionNotes = "Blocked IP address and updated input validation",
                    IsActive = false
                },
                new SecurityThreat
                {
                    Id = Guid.NewGuid().ToString(),
                    ThreatType = "Account Takeover Attempt",
                    Severity = "High",
                    Status = "Active",
                    Description = "Multiple password reset attempts for the same account",
                    SourceIp = "10.0.0.50",
                    UserAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15",
                    CreatedAt = DateTime.UtcNow.AddMinutes(-15),
                    IsActive = true
                },
                new SecurityThreat
                {
                    Id = Guid.NewGuid().ToString(),
                    ThreatType = "DDoS Attack",
                    Severity = "High",
                    Status = "Active",
                    Description = "Distributed denial of service attack detected",
                    SourceIp = "Multiple",
                    UserAgent = "Various",
                    CreatedAt = DateTime.UtcNow.AddMinutes(-5),
                    IsActive = true
                },
                new SecurityThreat
                {
                    Id = Guid.NewGuid().ToString(),
                    ThreatType = "Data Exfiltration Attempt",
                    Severity = "Critical",
                    Status = "Active",
                    Description = "Attempt to access sensitive data without proper authorization",
                    SourceIp = "45.33.12.78",
                    UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    CreatedAt = DateTime.UtcNow.AddMinutes(-10),
                    IsActive = true
                },
                new SecurityThreat
                {
                    Id = Guid.NewGuid().ToString(),
                    ThreatType = "Malware Detection",
                    Severity = "Medium",
                    Status = "Resolved",
                    Description = "Malicious file upload attempt detected",
                    SourceIp = "185.199.108.153",
                    UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    CreatedAt = DateTime.UtcNow.AddDays(-2),
                    ResolvedAt = DateTime.UtcNow.AddDays(-1),
                    ResolvedBy = "security@secureauth.com",
                    ResolutionNotes = "File blocked and user account suspended",
                    IsActive = false
                },
                new SecurityThreat
                {
                    Id = Guid.NewGuid().ToString(),
                    ThreatType = "Session Hijacking",
                    Severity = "High",
                    Status = "Active",
                    Description = "Multiple sessions detected from different locations",
                    SourceIp = "104.16.124.96",
                    UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    CreatedAt = DateTime.UtcNow.AddHours(-3),
                    IsActive = true
                },
                new SecurityThreat
                {
                    Id = Guid.NewGuid().ToString(),
                    ThreatType = "API Abuse",
                    Severity = "Low",
                    Status = "Active",
                    Description = "Excessive API calls detected from single IP",
                    SourceIp = "151.101.193.69",
                    UserAgent = "Python-requests/2.25.1",
                    CreatedAt = DateTime.UtcNow.AddHours(-4),
                    IsActive = true
                }
            };
        }
    }
} 