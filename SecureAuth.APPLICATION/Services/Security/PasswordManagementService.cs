using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using SecureAuth.DOMAIN.Models;
using SecureAuth.DOMAIN.Models.Security;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.APPLICATION.DTOs.Security;

namespace SecureAuth.APPLICATION.Services.Security
{
    public class PasswordManagementService : IPasswordManagementService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IEmailService _emailService;
        private readonly IActivityLogService _activityLogService;
        private readonly IPasswordHistoryRepository _passwordHistoryRepository;
        private readonly IPasswordResetTokenRepository _passwordResetTokenRepository;
        private readonly PasswordPolicy _passwordPolicy;
        private readonly IConfiguration _configuration;
        private readonly IPasswordGeneratorService _passwordGenerator;

        // Common passwords to prevent
        private static readonly HashSet<string> CommonPasswords = new(StringComparer.OrdinalIgnoreCase)
        {
            "password", "123456", "123456789", "qwerty", "abc123", "password123",
            "admin", "letmein", "welcome", "monkey", "dragon", "master", "hello",
            "freedom", "whatever", "qazwsx", "trustno1", "jordan", "harley",
            "ranger", "iwantu", "jennifer", "hunter", "buster", "soccer",
            "baseball", "tiger", "charlie", "andrew", "michelle", "love",
            "sunshine", "jessica", "asshole", "696969", "amanda", "access",
            "computer", "cookie", "mickey", "starwars", "shadow", "maggie",
            "654321", "superman", "george", "ass", "bailey", "guitar",
            "jackson", "chelsea", "black", "diamond", "nascar", "cowboy"
        };

        public PasswordManagementService(
            UserManager<ApplicationUser> userManager,
            IEmailService emailService,
            IActivityLogService activityLogService,
            IPasswordHistoryRepository passwordHistoryRepository,
            IPasswordResetTokenRepository passwordResetTokenRepository,
            IOptions<PasswordPolicy> passwordPolicy,
            IConfiguration configuration,
            IPasswordGeneratorService passwordGenerator)
        {
            _userManager = userManager;
            _emailService = emailService;
            _activityLogService = activityLogService;
            _passwordHistoryRepository = passwordHistoryRepository;
            _passwordResetTokenRepository = passwordResetTokenRepository;
            _passwordPolicy = passwordPolicy.Value;
            _configuration = configuration;
            _passwordGenerator = passwordGenerator;
        }

        public async Task<PasswordResponse> ChangePasswordAsync(string userId, ChangePasswordRequest request)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    return new PasswordResponse
                    {
                        Success = false,
                        Message = "User not found"
                    };
                }

                // Validate new password
                var validationResult = await ValidatePasswordAsync(new PasswordValidationRequest 
                { 
                    Password = request.NewPassword 
                });
                
                if (!validationResult.Success)
                {
                    return new PasswordResponse
                    {
                        Success = false,
                        Message = "Password validation failed",
                        ValidationErrors = validationResult.ValidationErrors
                    };
                }

                // Check if new password is in history
                if (await IsPasswordInHistoryAsync(userId, request.NewPassword))
                {
                    return new PasswordResponse
                    {
                        Success = false,
                        Message = "New password cannot be the same as recent passwords"
                    };
                }

                // Change password
                var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
                
                if (result.Succeeded)
                {
                    // Update password history
                    await AddPasswordToHistoryAsync(userId, request.NewPassword, userId, "User Change");
                    
                    // Update user's password change date
                    user.PasswordChangedAt = DateTime.UtcNow;
                    await _userManager.UpdateAsync(user);

                    // Log the password change
                    await _activityLogService.LogActionAsync(userId, "Password Changed", 
                        $"Password changed successfully. IP: {GetClientIpAddress()}");

                    return new PasswordResponse
                    {
                        Success = true,
                        Message = "Password changed successfully"
                    };
                }

                return new PasswordResponse
                {
                    Success = false,
                    Message = string.Join(", ", result.Errors.Select(e => e.Description))
                };
            }
            catch (Exception ex)
            {
                return new PasswordResponse
                {
                    Success = false,
                    Message = "An error occurred while changing password"
                };
            }
        }

        public async Task<PasswordResponse> ForgotPasswordAsync(ForgotPasswordRequest request)
        {
            try
            {
                var user = await _userManager.FindByEmailAsync(request.Email);
                if (user == null)
                {
                    // Don't reveal if user exists or not for security
                    return new PasswordResponse
                    {
                        Success = true,
                        Message = "If the email exists, a password reset link has been sent"
                    };
                }

                // Check if user is locked out
                if (await _userManager.IsLockedOutAsync(user))
                {
                    return new PasswordResponse
                    {
                        Success = false,
                        Message = "Account is temporarily locked. Please try again later."
                    };
                }

                // Generate reset token
                var token = await _userManager.GeneratePasswordResetTokenAsync(user);
                
                // Set token expiration (24 hours)
                var expiresAt = DateTime.UtcNow.AddHours(24);

                // Store reset token with expiration
                await StoreResetTokenAsync(user.Id, token, expiresAt);

                // Send email
                var resetLink = $"{_configuration["AppSettings:FrontendUrl"]}/reset-password?email={Uri.EscapeDataString(request.Email)}&token={Uri.EscapeDataString(token)}";
                
                await _emailService.SendPasswordResetEmailAsync(request.Email, resetLink, expiresAt);

                // Log the request
                await _activityLogService.LogActionAsync(user.Id, "Password Reset Requested", 
                    $"Password reset requested for email: {request.Email}");

                return new PasswordResponse
                {
                    Success = true,
                    Message = "Password reset link has been sent to your email",
                    ExpiresAt = expiresAt
                };
            }
            catch (Exception ex)
            {
                return new PasswordResponse
                {
                    Success = false,
                    Message = "An error occurred while processing the request"
                };
            }
        }

        public async Task<PasswordResponse> ResetPasswordAsync(ResetPasswordRequest request)
        {
            try
            {
                var user = await _userManager.FindByEmailAsync(request.Email);
                if (user == null)
                {
                    return new PasswordResponse
                    {
                        Success = false,
                        Message = "Invalid email or token"
                    };
                }

                // Validate token
                if (!await IsValidResetTokenAsync(user.Id, request.Token))
                {
                    return new PasswordResponse
                    {
                        Success = false,
                        Message = "Invalid or expired reset token"
                    };
                }

                // Validate new password
                var validationResult = await ValidatePasswordAsync(new PasswordValidationRequest 
                { 
                    Password = request.NewPassword 
                });
                
                if (!validationResult.Success)
                {
                    return new PasswordResponse
                    {
                        Success = false,
                        Message = "Password validation failed",
                        ValidationErrors = validationResult.ValidationErrors
                    };
                }

                // Check if new password is in history
                if (await IsPasswordInHistoryAsync(user.Id, request.NewPassword))
                {
                    return new PasswordResponse
                    {
                        Success = false,
                        Message = "New password cannot be the same as recent passwords"
                    };
                }

                // Reset password
                var result = await _userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);
                
                if (result.Succeeded)
                {
                    // Update password history
                    await AddPasswordToHistoryAsync(user.Id, request.NewPassword, user.Id, "Password Reset");
                    
                    // Update user's password change date
                    user.PasswordChangedAt = DateTime.UtcNow;
                    await _userManager.UpdateAsync(user);

                    // Invalidate the reset token
                    await InvalidateResetTokenAsync(user.Id, request.Token);

                    // Log the password reset
                    await _activityLogService.LogActionAsync(user.Id, "Password Reset", 
                        $"Password reset successfully. IP: {GetClientIpAddress()}");

                    return new PasswordResponse
                    {
                        Success = true,
                        Message = "Password reset successfully"
                    };
                }

                return new PasswordResponse
                {
                    Success = false,
                    Message = string.Join(", ", result.Errors.Select(e => e.Description))
                };
            }
            catch (Exception ex)
            {
                return new PasswordResponse
                {
                    Success = false,
                    Message = "An error occurred while resetting password"
                };
            }
        }

        public async Task<PasswordResponse> ValidatePasswordAsync(PasswordValidationRequest request)
        {
            var errors = new List<string>();

            // Check minimum length
            if (request.Password.Length < _passwordPolicy.MinLength)
            {
                errors.Add($"Password must be at least {_passwordPolicy.MinLength} characters long");
            }

            // Check maximum length (hardcoded to 128 for now)
            if (request.Password.Length > 128)
            {
                errors.Add("Password must not exceed 128 characters");
            }

            if (_passwordPolicy.RequireUppercase && !request.Password.Any(char.IsUpper))
            {
                errors.Add("Password must contain at least one uppercase letter");
            }
            if (_passwordPolicy.RequireLowercase && !request.Password.Any(char.IsLower))
            {
                errors.Add("Password must contain at least one lowercase letter");
            }
            if (_passwordPolicy.RequireDigit && !request.Password.Any(char.IsDigit))
            {
                errors.Add("Password must contain at least one digit");
            }
            if (_passwordPolicy.RequireSpecialCharacter && !request.Password.Any(c => !char.IsLetterOrDigit(c)))
            {
                errors.Add("Password must contain at least one special character");
            }
            if (_passwordPolicy.PreventCommonPasswords && CommonPasswords.Contains(request.Password.ToLower()))
            {
                errors.Add("Password cannot be a common password");
            }
            // Sequential/repeated character checks are not enforced unless you add them to PasswordPolicy

            return new PasswordResponse
            {
                Success = errors.Count == 0,
                Message = errors.Count == 0 ? "Password is valid" : "Password validation failed",
                ValidationErrors = errors
            };
        }

        public async Task<bool> IsPasswordExpiredAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user?.PasswordChangedAt == null) return false;

            var maxAge = _passwordPolicy.MaxAgeDays;
            return user.PasswordChangedAt.Value.AddDays(maxAge) < DateTime.UtcNow;
        }

        public async Task<List<PasswordHistoryEntry>> GetPasswordHistoryAsync(string userId)
        {
            return await _passwordHistoryRepository.GetPasswordHistoryAsync(userId);
        }

        public async Task<PasswordPolicyInfo> GetPasswordPolicyAsync()
        {
            // Map PasswordPolicy to PasswordPolicyInfo, using defaults for missing properties
            return new PasswordPolicyInfo
            {
                MinimumLength = _passwordPolicy.MinLength,
                MaximumLength = 128, // Default, since PasswordPolicy does not have this
                RequireUppercase = _passwordPolicy.RequireUppercase,
                RequireLowercase = _passwordPolicy.RequireLowercase,
                RequireDigit = _passwordPolicy.RequireDigit,
                RequireSpecialCharacter = _passwordPolicy.RequireSpecialCharacter,
                PreventSequentialCharacters = false, // Not in PasswordPolicy, set default
                PreventRepeatedCharacters = false, // Not in PasswordPolicy, set default
                ExpirationDays = _passwordPolicy.MaxAgeDays,
                MaxHistoryCount = _passwordPolicy.PasswordHistorySize
            };
        }

        public async Task<bool> ForcePasswordChangeAsync(string userId, string reason = "Admin Reset")
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null) return false;

                // Generate a temporary password
                var tempPassword = GenerateTemporaryPassword();
                
                // Reset password with temporary password
                var token = await _userManager.GeneratePasswordResetTokenAsync(user);
                var result = await _userManager.ResetPasswordAsync(user, token, tempPassword);
                
                if (result.Succeeded)
                {
                    // Update password history
                    await AddPasswordToHistoryAsync(userId, tempPassword, userId, reason);
                    
                    // Update user's password change date
                    user.PasswordChangedAt = DateTime.UtcNow;
                    await _userManager.UpdateAsync(user);

                    // Send email with temporary password
                    await _emailService.SendTemporaryPasswordEmailAsync(user.Email, user.UserName, tempPassword);

                    // Log the forced password change
                    await _activityLogService.LogActionAsync(userId, "Password Force Changed", 
                        $"Password force changed by admin. Reason: {reason}");

                    return true;
                }

                return false;
            }
            catch (Exception)
            {
                return false;
            }
        }

        private async Task<bool> IsPasswordInHistoryAsync(string userId, string newPassword)
        {
            var hashedPassword = _userManager.PasswordHasher.HashPassword(null, newPassword);
            
            return await _passwordHistoryRepository.IsPasswordInHistoryAsync(userId, hashedPassword);
        }

        private async Task AddPasswordToHistoryAsync(string userId, string password, string changedBy, string reason)
        {
            var hashedPassword = _userManager.PasswordHasher.HashPassword(null, password);
            
            await _passwordHistoryRepository.AddPasswordToHistoryAsync(userId, hashedPassword, changedBy, reason);
        }

        private async Task StoreResetTokenAsync(string userId, string token, DateTime expiresAt)
        {
            await _passwordResetTokenRepository.StoreResetTokenAsync(userId, token, expiresAt);
        }

        private async Task<bool> IsValidResetTokenAsync(string userId, string token)
        {
            return await _passwordResetTokenRepository.IsValidResetTokenAsync(userId, token);
        }

        private async Task InvalidateResetTokenAsync(string userId, string token)
        {
            await _passwordResetTokenRepository.InvalidateResetTokenAsync(userId, token);
        }

        private bool HasSequentialCharacters(string password)
        {
            for (int i = 0; i < password.Length - 2; i++)
            {
                if (char.IsDigit(password[i]) && char.IsDigit(password[i + 1]) && char.IsDigit(password[i + 2]))
                {
                    if (password[i + 1] == password[i] + 1 && password[i + 2] == password[i] + 2)
                        return true;
                }
                else if (char.IsLetter(password[i]) && char.IsLetter(password[i + 1]) && char.IsLetter(password[i + 2]))
                {
                    if (password[i + 1] == password[i] + 1 && password[i + 2] == password[i] + 2)
                        return true;
                }
            }
            return false;
        }

        private bool HasRepeatedCharacters(string password)
        {
            for (int i = 0; i < password.Length - 2; i++)
            {
                if (password[i] == password[i + 1] && password[i] == password[i + 2])
                    return true;
            }
            return false;
        }

        private string GenerateTemporaryPassword()
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
            var random = new Random();
            return new string(Enumerable.Repeat(chars, 12).Select(s => s[random.Next(s.Length)]).ToArray());
        }

        private string GetClientIpAddress()
        {
            // This would need to be implemented based on your HTTP context
            return "Unknown";
        }

        public async Task<(bool Success, string Message)> RegenerateAndSendPasswordAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return (false, "User not found");

            var tempPassword = _passwordGenerator.GenerateTemporaryPassword();
            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var result = await _userManager.ResetPasswordAsync(user, token, tempPassword);

            if (result.Succeeded)
            {
                await _emailService.SendTemporaryPasswordEmailAsync(user.Email, user.UserName, tempPassword);
                await _activityLogService.LogActionAsync(userId, "Password Regenerated by Admin", $"Temporary password sent to {user.Email}");
                return (true, "Password regenerated and sent to user email.");
            }
            return (false, string.Join("; ", result.Errors.Select(e => e.Description)));
        }
    }
} 
