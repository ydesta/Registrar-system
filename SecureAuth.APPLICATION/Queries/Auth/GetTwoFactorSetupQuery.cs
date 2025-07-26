using SecureAuth.APPLICATION.DTOs.User;

namespace SecureAuth.APPLICATION.Queries.Auth
{
    public class GetTwoFactorSetupQuery : IQuery<TwoFactorSetupModel>
    {
        public string UserId { get; set; } = string.Empty;
    }
} 
