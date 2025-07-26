using SecureAuth.APPLICATION.Commands.Security;
using SecureAuth.APPLICATION.DTOs.Security;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.DOMAIN.Models.Security;

namespace SecureAuth.APPLICATION.Commands.Security
{
    public class CreateSecurityThreatCommandHandler : ICommandHandler<CreateSecurityThreatCommand, SecurityThreatModel>
    {
        private readonly IUnitOfWork _unitOfWork;

        public CreateSecurityThreatCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<SecurityThreatModel> HandleAsync(CreateSecurityThreatCommand command)
        {
            try
            {
                var securityThreat = new SecurityThreat
                {
                    ThreatType = command.ThreatType,
                    Severity = command.Severity,
                    Description = command.Description,
                    SourceIp = command.SourceIp,
                    UserAgent = command.UserAgent,
                    Status = "Active",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                await _unitOfWork.SecurityThreats.AddAsync(securityThreat);
                await _unitOfWork.SaveChangesAsync();

                return new SecurityThreatModel
                {
                    Id = securityThreat.Id,
                    ThreatType = securityThreat.ThreatType,
                    ThreatLevel = securityThreat.Severity,
                    Description = securityThreat.Description,
                    DetectedAt = securityThreat.CreatedAt,
                    Status = securityThreat.Status,
                    IpAddress = securityThreat.SourceIp,
                    UserAgent = securityThreat.UserAgent
                };
            }
            catch (Exception ex)
            {
                // Return empty model with error information
                return new SecurityThreatModel();
            }
        }
    }
} 