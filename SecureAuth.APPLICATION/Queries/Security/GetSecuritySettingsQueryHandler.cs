using SecureAuth.APPLICATION.Queries.Security;
using SecureAuth.APPLICATION.DTOs.Security;
using SecureAuth.APPLICATION.Interfaces;

namespace SecureAuth.APPLICATION.Queries.Security
{
    public class GetSecuritySettingsQueryHandler : IQueryHandler<GetSecuritySettingsQuery, SecuritySettingsModel>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetSecuritySettingsQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<SecuritySettingsModel> HandleAsync(GetSecuritySettingsQuery query)
        {
            try
            {
                var settings = await _unitOfWork.SecuritySettings.GetSettingsAsync(query.SettingsSection);
                
                if (settings == null)
                {
                    return new SecuritySettingsModel 
                    { 
                        Success = false, 
                        Message = "Security settings not found" 
                    };
                }

                settings.Success = true;
                settings.Message = "Security settings retrieved successfully";
                return settings;
            }
            catch (Exception ex)
            {
                return new SecuritySettingsModel 
                { 
                    Success = false, 
                    Message = $"Error retrieving security settings: {ex.Message}" 
                };
            }
        }
    }
} 
