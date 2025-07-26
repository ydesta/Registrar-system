using SecureAuth.APPLICATION.DTOs.Security;

namespace SecureAuth.APPLICATION.Queries.Security
{
    public class GetPasswordPolicyQuery : IQuery<PasswordPolicyModel>
    {
        public bool IncludeHistory { get; set; } = false;
    }
} 
