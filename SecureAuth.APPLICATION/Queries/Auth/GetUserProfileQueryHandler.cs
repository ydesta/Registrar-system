using Microsoft.AspNetCore.Identity;
using SecureAuth.APPLICATION.DTOs.Authentication;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.DOMAIN.Models;

namespace SecureAuth.APPLICATION.Queries.Auth
{
    public class GetUserProfileQueryHandler : IQueryHandler<GetUserProfileQuery, UserProfileResponse>
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IUserProfileService _userProfileService;

        public GetUserProfileQueryHandler(UserManager<ApplicationUser> userManager, IUserProfileService userProfileService)
        {
            _userManager = userManager;
            _userProfileService = userProfileService;
        }

        public async Task<UserProfileResponse> HandleAsync(GetUserProfileQuery query)
        {
            var user = await _userManager.FindByIdAsync(query.UserId);
            if (user == null)
            {
                return new UserProfileResponse { Success = false, Message = "User not found." };
            }

            var roles = query.IncludeRoles ? await _userProfileService.GetUserRolesAsync(query.UserId) : new List<string>();
            var permissions = query.IncludePermissions ? await _userProfileService.GetUserPermissionsAsync(query.UserId) : new List<string>();

            return new UserProfileResponse
            {
                Success = true,
                Message = "User profile retrieved successfully.",
                User = new UserInfo
                {
                    Id = user.Id,
                    Email = user.Email,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    PhoneNumber = user.PhoneNumber,
                    EmailConfirmed = user.EmailConfirmed,
                    PhoneNumberConfirmed = user.PhoneNumberConfirmed,
                    TwoFactorEnabled = user.TwoFactorEnabled,
                    IsActive = user.IsActive,
                    CreatedAt = user.CreatedAt,
                    LastLoginAt = user.LastLoginAt,
                    Roles = roles
                },
                Roles = roles,
                Permissions = permissions
            };
        }
    }
} 
