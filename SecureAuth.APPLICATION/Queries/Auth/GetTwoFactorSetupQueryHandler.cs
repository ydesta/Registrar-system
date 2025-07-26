using SecureAuth.APPLICATION.DTOs.User;
using SecureAuth.APPLICATION.Interfaces;

namespace SecureAuth.APPLICATION.Queries.Auth
{
    public class GetTwoFactorSetupQueryHandler : IQueryHandler<GetTwoFactorSetupQuery, TwoFactorSetupModel>
    {
        private readonly IUserManagement _userManagement;

        public GetTwoFactorSetupQueryHandler(IUserManagement userManagement)
        {
            _userManagement = userManagement;
        }

        public async Task<TwoFactorSetupModel> HandleAsync(GetTwoFactorSetupQuery query)
        {
            var result = await _userManagement.GetTwoFactorSetupAsync(query.UserId);
            if (result is TwoFactorSetupModel model)
                return model;

            // Map from anonymous object to DTO if needed
            return new TwoFactorSetupModel
            {
                Success = (bool)result.GetType().GetProperty("Success")?.GetValue(result)!,
                UserId = result.GetType().GetProperty("UserId")?.GetValue(result)?.ToString(),
                Email = result.GetType().GetProperty("Email")?.GetValue(result)?.ToString(),
                IsTwoFactorEnabled = (bool?)result.GetType().GetProperty("IsTwoFactorEnabled")?.GetValue(result) ?? false,
                AvailableProviders = result.GetType().GetProperty("AvailableProviders")?.GetValue(result) as List<string> ?? new List<string>(),
                Message = result.GetType().GetProperty("Message")?.GetValue(result)?.ToString()
            };
        }
    }
} 
