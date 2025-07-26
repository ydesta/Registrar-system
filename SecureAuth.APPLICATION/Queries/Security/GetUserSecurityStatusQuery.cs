using SecureAuth.APPLICATION.DTOs.Security;

namespace SecureAuth.APPLICATION.Queries.Security
{
    public class GetUserSecurityStatusQuery : IQuery<UserSecurityStatusModel>
    {
        public string UserId { get; set; } = string.Empty;
        public bool IncludeRiskAssessment { get; set; } = true;
        public bool IncludeSecurityEvents { get; set; } = true;
        public bool IncludeComplianceStatus { get; set; } = false;
    }
} 
