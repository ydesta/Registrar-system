using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.APPLICATION.DTOs.Security;

namespace SecureAuth.APPLICATION.Commands.Auth
{
    public class ChangePasswordCommandHandler : ICommandHandler<ChangePasswordCommand, ChangePasswordResponse>
    {
        private readonly IPasswordManagementService _passwordManagementService;

        public ChangePasswordCommandHandler(IPasswordManagementService passwordManagementService)
        {
            _passwordManagementService = passwordManagementService;
        }

        public async Task<ChangePasswordResponse> HandleAsync(ChangePasswordCommand command)
        {
            try
            {
                // Validate that passwords match
                if (command.NewPassword != command.ConfirmPassword)
                {
                    return new ChangePasswordResponse
                    {
                        Success = false,
                        Message = "New password and confirmation password do not match"
                    };
                }

                // Create the request for the password management service
                var request = new ChangePasswordRequest
                {
                    CurrentPassword = command.CurrentPassword,
                    NewPassword = command.NewPassword,
                    ConfirmPassword = command.ConfirmPassword
                };

                // Call the password management service
                var result = await _passwordManagementService.ChangePasswordAsync(command.UserId, request);

                return new ChangePasswordResponse
                {
                    Success = result.Success,
                    Message = result.Message,
                    ValidationErrors = result.ValidationErrors ?? new List<string>()
                };
            }
            catch (Exception ex)
            {
                return new ChangePasswordResponse
                {
                    Success = false,
                    Message = "An error occurred while changing password"
                };
            }
        }
    }
} 