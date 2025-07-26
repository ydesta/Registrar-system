using SecureAuth.APPLICATION.Commands.Security;
using SecureAuth.APPLICATION.DTOs.Security;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.DOMAIN.Models.Security;

namespace SecureAuth.APPLICATION.Commands.Security
{
    public class UpdateSecurityThreatCommandHandler : ICommandHandler<UpdateSecurityThreatCommand, SecurityThreatModel>
    {
        private readonly IUnitOfWork _unitOfWork;

        public UpdateSecurityThreatCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<SecurityThreatModel> HandleAsync(UpdateSecurityThreatCommand command)
        {
            try
            {
                var securityThreat = await _unitOfWork.SecurityThreats.GetByIdAsync(command.ThreatId);
                
                if (securityThreat == null)
                {
                    return new SecurityThreatModel(); // Return empty model if not found
                }

                securityThreat.Status = command.Status;
                securityThreat.ResolutionNotes = command.ResolutionNotes;
                securityThreat.ResolvedBy = command.ResolvedBy;
                
                if (command.Status == "Resolved")
                {
                    securityThreat.ResolvedAt = DateTime.UtcNow;
                    securityThreat.IsActive = false;
                }

                await _unitOfWork.SecurityThreats.UpdateAsync(securityThreat);
                await _unitOfWork.SaveChangesAsync();

                return new SecurityThreatModel
                {
                    Id = securityThreat.Id,
                    ThreatType = securityThreat.ThreatType,
                    ThreatLevel = securityThreat.Severity,
                    Description = securityThreat.Description,
                    DetectedAt = securityThreat.CreatedAt,
                    ResolvedAt = securityThreat.ResolvedAt,
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