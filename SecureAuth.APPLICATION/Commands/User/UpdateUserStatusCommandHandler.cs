using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.APPLICATION.Mediator;
using SecureAuth.APPLICATION.Commands.User;
using Microsoft.Extensions.Logging;

namespace SecureAuth.APPLICATION.Commands.User
{
    public class UpdateUserStatusCommandHandler : ICommandHandler<UpdateUserStatusCommand, bool>
    {
        private readonly IUserRepository _userRepository;
        private readonly ILogger<UpdateUserStatusCommandHandler> _logger;

        public UpdateUserStatusCommandHandler(
            IUserRepository userRepository,
            ILogger<UpdateUserStatusCommandHandler> logger)
        {
            _userRepository = userRepository;
            _logger = logger;
        }

        public async Task<bool> HandleAsync(UpdateUserStatusCommand command)
        {
            try
            {
                var result = await _userRepository.UpdateUserStatusAsync(command.UserId, command.IsActive);
                
                if (result)
                {
                    _logger.LogInformation("User status updated successfully. UserId: {UserId}, IsActive: {IsActive}", 
                        command.UserId, command.IsActive);
                }
                else
                {
                    _logger.LogWarning("Failed to update user status. UserId: {UserId}", command.UserId);
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user status. UserId: {UserId}", command.UserId);
                return false;
            }
        }
    }
} 