using SecureAuth.APPLICATION.Interfaces;
using System.Threading.Tasks;

namespace SecureAuth.APPLICATION.Commands.User
{
    public class RegeneratePasswordCommandHandler : ICommandHandler<RegeneratePasswordCommand, RegeneratePasswordResult>
    {
        private readonly IPasswordManagementService _passwordService;

        public RegeneratePasswordCommandHandler(IPasswordManagementService passwordService)
        {
            _passwordService = passwordService;
        }

        public async Task<RegeneratePasswordResult> HandleAsync(RegeneratePasswordCommand command)
        {
            var result = await _passwordService.RegenerateAndSendPasswordAsync(command.UserId);
            return new RegeneratePasswordResult
            {
                Success = result.Success,
                Message = result.Message
            };
        }
    }
} 