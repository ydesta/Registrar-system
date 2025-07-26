using SecureAuth.APPLICATION.Queries.Admin;
using SecureAuth.APPLICATION.DTOs.Admin;
using SecureAuth.APPLICATION.Interfaces;

namespace SecureAuth.APPLICATION.Queries.Admin
{
    public class GetSystemConfigurationQueryHandler : IQueryHandler<GetSystemConfigurationQuery, SystemConfigurationModel>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetSystemConfigurationQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<SystemConfigurationModel> HandleAsync(GetSystemConfigurationQuery query)
        {
            try
            {
                var configuration = await _unitOfWork.SystemConfiguration.GetConfigurationAsync(query.ConfigurationSection);
                
                if (configuration == null)
                {
                    return new SystemConfigurationModel 
                    { 
                        Success = false, 
                        Message = "Configuration not found" 
                    };
                }

                configuration.Success = true;
                configuration.Message = "Configuration retrieved successfully";
                return configuration;
            }
            catch (Exception ex)
            {
                return new SystemConfigurationModel 
                { 
                    Success = false, 
                    Message = $"Error retrieving configuration: {ex.Message}" 
                };
            }
        }
    }
} 
