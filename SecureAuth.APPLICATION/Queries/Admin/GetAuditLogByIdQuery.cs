using SecureAuth.APPLICATION.DTOs.Admin;

namespace SecureAuth.APPLICATION.Queries.Admin
{
    public class GetAuditLogByIdQuery : IQuery<AuditLogModel>
    {
        public string Id { get; set; } = string.Empty;
    }
} 