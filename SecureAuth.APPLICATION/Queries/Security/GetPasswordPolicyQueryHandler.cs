using SecureAuth.APPLICATION.Queries.Security;
using SecureAuth.APPLICATION.DTOs.Security;
using SecureAuth.APPLICATION.Interfaces;

namespace SecureAuth.APPLICATION.Queries.Security
{
    public class GetPasswordPolicyQueryHandler : IQueryHandler<GetPasswordPolicyQuery, PasswordPolicyModel>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetPasswordPolicyQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<PasswordPolicyModel> HandleAsync(GetPasswordPolicyQuery query)
        {
            try
            {
                var policy = await _unitOfWork.PasswordPolicy.GetCurrentPolicyAsync();
                
                if (policy == null)
                {
                    return new PasswordPolicyModel 
                    { 
                        Success = false, 
                        Message = "Password policy not found" 
                    };
                }

                // Include history if requested
                if (query.IncludeHistory)
                {
                    policy.PolicyHistory = await _unitOfWork.PasswordPolicy.GetPolicyHistoryAsync();
                }

                policy.Success = true;
                policy.Message = "Password policy retrieved successfully";
                return policy;
            }
            catch (Exception ex)
            {
                return new PasswordPolicyModel 
                { 
                    Success = false, 
                    Message = $"Error retrieving password policy: {ex.Message}" 
                };
            }
        }
    }
} 
