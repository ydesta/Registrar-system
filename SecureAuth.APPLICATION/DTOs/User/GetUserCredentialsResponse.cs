using SecureAuth.APPLICATION.DTOs;

namespace SecureAuth.APPLICATION.DTOs.User
{
    public class GetUserCredentialsResponse : Response
    {
        public List<UserCredentialDto> UserCredentials { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
        public bool HasNextPage => Page < TotalPages;
        public bool HasPreviousPage => Page > 1;
    }
}

