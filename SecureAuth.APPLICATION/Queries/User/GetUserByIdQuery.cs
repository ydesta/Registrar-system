using SecureAuth.APPLICATION.DTOs.User;

namespace SecureAuth.APPLICATION.Queries.User
{
    public class GetUserByIdQuery : IQuery<UserDetailsResponse>
    {
        public string UserId { get; set; } = string.Empty;
        public bool IncludeRoles { get; set; } = true;
        public bool IncludePermissions { get; set; } = false;
    }
} 
