using SecureAuth.APPLICATION.Queries.Security;
using SecureAuth.APPLICATION.DTOs.Security;
using SecureAuth.APPLICATION.Interfaces;

namespace SecureAuth.APPLICATION.Queries.Security
{
    public class GetSecurityThreatsQueryHandler : IQueryHandler<GetSecurityThreatsQuery, List<SecurityThreatModel>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetSecurityThreatsQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<List<SecurityThreatModel>> HandleAsync(GetSecurityThreatsQuery query)
        {
            try
            {
                var threats = await _unitOfWork.SecurityThreats.GetThreatsAsync(
                    startDate: query.StartDate,
                    endDate: query.EndDate,
                    threatLevel: query.ThreatLevel,
                    threatType: query.ThreatType,
                    includeResolved: query.IncludeResolved,
                    page: query.Page,
                    pageSize: query.PageSize);

                return threats.Select(threat => new SecurityThreatModel
                {
                    Id = threat.Id,
                    ThreatType = threat.ThreatType,
                    ThreatLevel = threat.ThreatLevel,
                    Description = threat.Description,
                    DetectedAt = threat.DetectedAt,
                    ResolvedAt = threat.ResolvedAt,
                    Status = threat.Status,
                    AffectedUsers = threat.AffectedUsers,
                    IpAddress = threat.IpAddress,
                    UserAgent = threat.UserAgent,
                    Recommendations = threat.Recommendations
                }).ToList();
            }
            catch (Exception)
            {
                return new List<SecurityThreatModel>();
            }
        }
    }
} 
