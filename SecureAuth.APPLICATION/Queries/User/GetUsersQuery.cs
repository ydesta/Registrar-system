using SecureAuth.APPLICATION.DTOs.User;

namespace SecureAuth.APPLICATION.Queries.User
{
    public class GetUsersQuery : IQuery<UsersListResponse>
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string? SearchTerm { get; set; }
        public string? RoleFilter { get; set; }
        public bool? IsActiveFilter { get; set; }
        public string? SortBy { get; set; } = "CreatedAt";
        public bool SortDescending { get; set; } = true;
        public bool IncludeRoles { get; set; } = false;
    }
} 
