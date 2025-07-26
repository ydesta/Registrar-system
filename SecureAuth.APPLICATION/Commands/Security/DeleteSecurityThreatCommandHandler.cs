using SecureAuth.APPLICATION.Commands.Security;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.DOMAIN.Models.Security;

namespace SecureAuth.APPLICATION.Commands.Security
{
    public class DeleteSecurityThreatCommandHandler : ICommandHandler<DeleteSecurityThreatCommand, bool>
    {
        private readonly IUnitOfWork _unitOfWork;

        public DeleteSecurityThreatCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<bool> HandleAsync(DeleteSecurityThreatCommand command)
        {
            try
            {
                var securityThreat = await _unitOfWork.SecurityThreats.GetByIdAsync(command.ThreatId);
                
                if (securityThreat == null)
                {
                    return false; // Return false if not found
                }

                await _unitOfWork.SecurityThreats.DeleteAsync(securityThreat);
                await _unitOfWork.SaveChangesAsync();

                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }
    }
} 