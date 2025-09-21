using SecureAuth.APPLICATION.Queries;
using SecureAuth.APPLICATION.DTOs.User;

namespace SecureAuth.APPLICATION.Queries.User
{
    public class GetUserCredentialsQuery : IQuery<GetUserCredentialsResponse>
    {
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string? EmailFilter { get; set; }
        public string? SortBy { get; set; } = "CreatedAt";
        public bool SortDescending { get; set; } = true;
    }
}
