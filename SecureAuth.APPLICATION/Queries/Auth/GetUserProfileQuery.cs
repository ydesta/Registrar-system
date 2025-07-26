using SecureAuth.APPLICATION.DTOs.Authentication;

namespace SecureAuth.APPLICATION.Queries.Auth
{
    public class GetUserProfileQuery : IQuery<UserProfileResponse>
    {
        public string UserId { get; set; } = string.Empty;
        public bool IncludeRoles { get; set; } = true;
        public bool IncludePermissions { get; set; } = false;
    }
} 
