using Microsoft.AspNetCore.Identity;
using SecureAuth.APPLICATION.DTOs.Authentication;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.DOMAIN.Models;

namespace SecureAuth.APPLICATION.Commands.Auth
{
    public class ResendVerificationCommandHandler : ICommandHandler<ResendVerificationCommand, ResendVerificationResponse>
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IEmailService _emailService;

        public ResendVerificationCommandHandler(
            UserManager<ApplicationUser> userManager,
            IEmailService emailService)
        {
            _userManager = userManager;
            _emailService = emailService;
        }

        public async Task<ResendVerificationResponse> HandleAsync(ResendVerificationCommand command)
        {
            var user = await _userManager.FindByEmailAsync(command.Email);
            if (user == null)
            {
                // Don't reveal if user exists or not for security
                return new ResendVerificationResponse 
                { 
                    Success = true, 
                    Message = "If the email is registered and not verified, a verification email has been sent." 
                };
            }

            // Check if email is already confirmed
            if (user.EmailConfirmed)
            {
                return new ResendVerificationResponse 
                { 
                    Success = false, 
                    Message = "Email is already verified." 
                };
            }

            // Generate new confirmation token
            var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            
            // Send verification email
            await _emailService.SendEmailConfirmationAsync(user.Email, token);

            return new ResendVerificationResponse 
            { 
                Success = true, 
                Message = "Verification email has been sent. Please check your email and click the verification link." 
            };
        }
    }
} 