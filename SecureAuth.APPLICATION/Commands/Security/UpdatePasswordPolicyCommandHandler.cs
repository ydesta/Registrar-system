using SecureAuth.APPLICATION.Commands.Security;
using SecureAuth.APPLICATION.DTOs.Security;
using SecureAuth.APPLICATION.Interfaces;

namespace SecureAuth.APPLICATION.Commands.Security
{
    public class UpdatePasswordPolicyCommandHandler : ICommandHandler<UpdatePasswordPolicyCommand, bool>
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IActivityLogService _activityLogService;
        private readonly IPasswordValidationService _passwordValidationService;

        public UpdatePasswordPolicyCommandHandler(
            IUnitOfWork unitOfWork,
            IActivityLogService activityLogService,
            IPasswordValidationService passwordValidationService)
        {
            _unitOfWork = unitOfWork;
            _activityLogService = activityLogService;
            _passwordValidationService = passwordValidationService;
        }

        public async Task<bool> HandleAsync(UpdatePasswordPolicyCommand command)
        {
            try
            {
                var policy = command.PasswordPolicy;
                
                // Validate password policy settings
                if (!ValidatePasswordPolicy(policy))
                {
                    return false;
                }

                // Check if new policy would invalidate existing passwords
                var wouldInvalidatePasswords = await CheckPasswordPolicyImpact(policy);
                if (wouldInvalidatePasswords)
                {
                    // Log warning but allow the change
                    await _activityLogService.LogUserActionAsync(
                        "System",
                        "UpdatePasswordPolicy",
                        "PasswordPolicy",
                        "System",
                        "Password policy update may invalidate existing passwords");
                }

                // Update password policy
                var success = await _unitOfWork.PasswordPolicy.UpdatePolicyAsync(policy);
                if (!success)
                {
                    return false;
                }

                // Log the policy change
                await _activityLogService.LogUserActionAsync(
                    "System",
                    "UpdatePasswordPolicy",
                    "PasswordPolicy",
                    "System",
                    $"Password policy updated: MinLength={policy.MinLength}, " +
                    $"RequireUppercase={policy.RequireUppercase}, " +
                    $"RequireLowercase={policy.RequireLowercase}, " +
                    $"RequireDigit={policy.RequireDigit}, " +
                    $"RequireSpecialChar={policy.RequireSpecialChar}");

                await _unitOfWork.SaveChangesAsync();
                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

        private bool ValidatePasswordPolicy(PasswordPolicyModel policy)
        {
            // Minimum length validation
            if (policy.MinLength < 8)
            {
                return false; // Minimum 8 characters required
            }

            if (policy.MinLength > 128)
            {
                return false; // Maximum 128 characters
            }

            // Maximum age validation
            if (policy.MaxAgeDays < 1)
            {
                return false; // Minimum 1 day
            }

            if (policy.MaxAgeDays > 365)
            {
                return false; // Maximum 1 year
            }

            // History validation
            if (policy.HistoryCount < 0 || policy.HistoryCount > 24)
            {
                return false; // 0-24 password history
            }

            // Lockout validation
            if (policy.LockoutThreshold < 1 || policy.LockoutThreshold > 10)
            {
                return false; // 1-10 failed attempts
            }

            if (policy.LockoutDurationMinutes < 1 || policy.LockoutDurationMinutes > 1440)
            {
                return false; // 1 minute to 24 hours
            }

            return true;
        }

        private async Task<bool> CheckPasswordPolicyImpact(PasswordPolicyModel newPolicy)
        {
            // Check if new policy would invalidate existing passwords
            // This is a simplified check - in practice, you'd validate against actual user passwords
            var currentPolicy = await _unitOfWork.PasswordPolicy.GetCurrentPolicyAsync();
            
            if (currentPolicy == null)
            {
                return false; // No current policy to compare against
            }

            // Check if requirements became stricter
            return newPolicy.MinLength > currentPolicy.MinLength ||
                   newPolicy.RequireUppercase && !currentPolicy.RequireUppercase ||
                   newPolicy.RequireLowercase && !currentPolicy.RequireLowercase ||
                   newPolicy.RequireDigit && !currentPolicy.RequireDigit ||
                   newPolicy.RequireSpecialChar && !currentPolicy.RequireSpecialChar;
        }
    }
} 
