using SecureAuth.APPLICATION.DTOs.Admin;
using SecureAuth.APPLICATION.Queries;

namespace SecureAuth.APPLICATION.Queries.Admin
{
    public class GetActivityLogByIdQuery : IQuery<ActivityLogModel>
    {
        public string Id { get; set; } = string.Empty;
    }
} 