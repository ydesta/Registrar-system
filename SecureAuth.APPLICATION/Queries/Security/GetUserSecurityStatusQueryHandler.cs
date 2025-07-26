using SecureAuth.APPLICATION.Queries.Security;
using SecureAuth.APPLICATION.DTOs.Security;
using SecureAuth.APPLICATION.Interfaces;
using Microsoft.AspNetCore.Identity;
using SecureAuth.DOMAIN.Models;

namespace SecureAuth.APPLICATION.Queries.Security
{
    public class GetUserSecurityStatusQueryHandler : IQueryHandler<GetUserSecurityStatusQuery, UserSecurityStatusModel>
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IUnitOfWork _unitOfWork;

        public GetUserSecurityStatusQueryHandler(
            UserManager<ApplicationUser> userManager,
            IUnitOfWork unitOfWork)
        {
            _userManager = userManager;
            _unitOfWork = unitOfWork;
        }

        public async Task<UserSecurityStatusModel> HandleAsync(GetUserSecurityStatusQuery query)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(query.UserId);
                if (user == null)
                {
                    return new UserSecurityStatusModel 
                    { 
                        Success = false, 
                        Message = "User not found" 
                    };
                }

                var securityStatus = new UserSecurityStatusModel
                {
                    UserId = user.Id,
                    Email = user.Email,
                    IsActive = user.IsActive,
                    IsLockedOut = user.LockoutEnd.HasValue && user.LockoutEnd.Value > DateTime.UtcNow,
                    LockoutEnd = user.LockoutEnd?.DateTime,
                    FailedLoginAttempts = user.AccessFailedCount,
                    LastLoginDate = user.LastLoginDate,
                    TwoFactorEnabled = user.TwoFactorEnabled,
                    EmailConfirmed = user.EmailConfirmed,
                    PhoneNumberConfirmed = user.PhoneNumberConfirmed
                };

                // Include risk assessment if requested
                if (query.IncludeRiskAssessment)
                {
                    securityStatus.RiskAssessment = await CalculateRiskAssessment(user);
                }

                // Include security events if requested
                if (query.IncludeSecurityEvents)
                {
                    securityStatus.SecurityEvents = await _unitOfWork.SecurityEvents.GetUserSecurityEventsAsync(
                        query.UserId, 
                        DateTime.UtcNow.AddDays(-30), 
                        DateTime.UtcNow);
                }

                // Include compliance status if requested
                if (query.IncludeComplianceStatus)
                {
                    securityStatus.ComplianceStatus = await CheckComplianceStatus(user);
                }

                securityStatus.Success = true;
                securityStatus.Message = "User security status retrieved successfully";
                return securityStatus;
            }
            catch (Exception ex)
            {
                return new UserSecurityStatusModel 
                { 
                    Success = false, 
                    Message = $"Error retrieving user security status: {ex.Message}" 
                };
            }
        }

        private async Task<RiskAssessmentModel> CalculateRiskAssessment(ApplicationUser user)
        {
            var riskScore = 0;
            var riskFactors = new List<string>();

            // Check failed login attempts
            if (user.AccessFailedCount > 3)
            {
                riskScore += 20;
                riskFactors.Add($"High failed login attempts: {user.AccessFailedCount}");
            }

            // Check if account is locked
            if (user.LockoutEnd.HasValue && user.LockoutEnd.Value > DateTime.UtcNow)
            {
                riskScore += 30;
                riskFactors.Add("Account is currently locked");
            }

            // Check last login date
            if (user.LastLoginDate.HasValue && user.LastLoginDate.Value < DateTime.UtcNow.AddDays(-90))
            {
                riskScore += 15;
                riskFactors.Add("Inactive account (no login for 90+ days)");
            }

            // Check 2FA status
            if (!user.TwoFactorEnabled)
            {
                riskScore += 10;
                riskFactors.Add("Two-factor authentication not enabled");
            }

            // Check email confirmation
            if (!user.EmailConfirmed)
            {
                riskScore += 5;
                riskFactors.Add("Email not confirmed");
            }

            // Determine risk level
            string riskLevel = riskScore switch
            {
                >= 50 => "High",
                >= 25 => "Medium",
                >= 10 => "Low",
                _ => "Minimal"
            };

            return new RiskAssessmentModel
            {
                RiskScore = riskScore,
                RiskLevel = riskLevel,
                RiskFactors = riskFactors,
                LastAssessed = DateTime.UtcNow
            };
        }

        private async Task<ComplianceStatusModel> CheckComplianceStatus(ApplicationUser user)
        {
            var complianceStatus = new ComplianceStatusModel
            {
                PasswordCompliant = await CheckPasswordCompliance(user),
                TwoFactorCompliant = user.TwoFactorEnabled,
                EmailCompliant = user.EmailConfirmed,
                AccountCompliant = user.IsActive && !user.LockoutEnd.HasValue,
                LastComplianceCheck = DateTime.UtcNow
            };

            complianceStatus.OverallCompliant = complianceStatus.PasswordCompliant &&
                                              complianceStatus.TwoFactorCompliant &&
                                              complianceStatus.EmailCompliant &&
                                              complianceStatus.AccountCompliant;

            return complianceStatus;
        }

        private async Task<bool> CheckPasswordCompliance(ApplicationUser user)
        {
            // Check if password meets current policy requirements
            var currentPolicy = await _unitOfWork.PasswordPolicy.GetCurrentPolicyAsync();
            if (currentPolicy == null)
            {
                return true; // No policy means compliant
            }

            // Check password age
            if (user.PasswordChangedDate.HasValue)
            {
                var passwordAge = DateTime.UtcNow - user.PasswordChangedDate.Value;
                if (passwordAge.TotalDays > currentPolicy.MaxAgeDays)
                {
                    return false; // Password expired
                }
            }

            return true; // Assume compliant if we can't determine otherwise
        }
    }
} 
