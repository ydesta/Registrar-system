using Microsoft.AspNetCore.Identity;
using SecureAuth.APPLICATION.DTOs.Authentication;
using SecureAuth.DOMAIN.Models;

namespace SecureAuth.APPLICATION.Commands.Auth
{
    public class ResetPasswordCommandHandler : ICommandHandler<ResetPasswordCommand, ResetPasswordResponse>
    {
        private readonly UserManager<ApplicationUser> _userManager;

        public ResetPasswordCommandHandler(UserManager<ApplicationUser> userManager)
        {
            _userManager = userManager;
        }

        public async Task<ResetPasswordResponse> HandleAsync(ResetPasswordCommand command)
        {
            var user = await _userManager.FindByEmailAsync(command.Email);
            if (user == null)
            {
                return new ResetPasswordResponse { Success = false, Message = "Invalid request." };
            }

            var result = await _userManager.ResetPasswordAsync(user, command.Token, command.NewPassword);
            if (!result.Succeeded)
            {
                return new ResetPasswordResponse { Success = false, Message = string.Join(", ", result.Errors.Select(e => e.Description)) };
            }

            return new ResetPasswordResponse { Success = true, Message = "Password has been reset successfully." };
        }
    }
} 
