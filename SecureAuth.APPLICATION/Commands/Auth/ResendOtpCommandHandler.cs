using Microsoft.AspNetCore.Identity;
using SecureAuth.APPLICATION.DTOs.Authentication;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.DOMAIN.Models;

namespace SecureAuth.APPLICATION.Commands.Auth
{
    public class ResendOtpCommandHandler : ICommandHandler<ResendOtpCommand, ResendOtpResponse>
    {
        private readonly IOtpService _otpService;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IActivityLogService _activityLogService;
        private readonly ISecurityEventService _securityEventService;

        public ResendOtpCommandHandler(
            IOtpService otpService,
            UserManager<ApplicationUser> userManager,
            IActivityLogService activityLogService,
            ISecurityEventService securityEventService)
        {
            _otpService = otpService;
            _userManager = userManager;
            _activityLogService = activityLogService;
            _securityEventService = securityEventService;
        }

        public async Task<ResendOtpResponse> HandleAsync(ResendOtpCommand command)
        {
            var user = await _userManager.FindByEmailAsync(command.Email);
            if (user == null)
            {
                // Don't reveal if user exists or not for security
                return new ResendOtpResponse 
                { 
                    Success = true, 
                    Message = "If the email is registered, a new verification code has been sent." 
                };
            }

            // Check if user has 2FA enabled
            if (!user.TwoFactorEnabled)
            {
                return new ResendOtpResponse 
                { 
                    Success = false, 
                    Message = "Two-factor authentication is not enabled for this account." 
                };
            }

            // Generate new OTP
            var otp = await _otpService.GenerateOtpAsync(user.Id, user.Email, command.Purpose);
            var expiry = await _otpService.GetOtpExpiryAsync(user.Id);

            // Log OTP resend
            await _activityLogService.LogUserActionAsync(
                user.Id,
                "OtpResend",
                "User",
                user.Id,
                $"OTP resent for {command.Purpose}");

            // Record security event
            await _securityEventService.RecordLoginAttemptAsync(user.Id, user.Email, false, "127.0.0.1", "Unknown", "OTP resent");

            return new ResendOtpResponse 
            { 
                Success = true, 
                Message = "A new verification code has been sent to your email address.",
                ExpiresAt = expiry
            };
        }
    }
} 