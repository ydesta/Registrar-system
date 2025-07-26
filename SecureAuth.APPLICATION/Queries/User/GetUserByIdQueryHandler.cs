using SecureAuth.APPLICATION.Queries.User;
using SecureAuth.APPLICATION.DTOs.User;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.DOMAIN.Models;

namespace SecureAuth.APPLICATION.Queries.User
{
    public class GetUserByIdQueryHandler : IQueryHandler<GetUserByIdQuery, UserDetailsResponse>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetUserByIdQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<UserDetailsResponse> HandleAsync(GetUserByIdQuery query)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(query.UserId);

            if (user == null)
            {
                return new UserDetailsResponse
                {
                    Success = false,
                    Message = "User not found",
                    User = null
                };
            }

            var userDetails = new UserDetails
            {
                Id = user.Id,
                Email = user.Email ?? string.Empty,
                PhoneNumber = user.PhoneNumber ?? string.Empty,
                FirstName = user.FirstName ?? string.Empty,
                LastName = user.LastName ?? string.Empty,
                IsActive = user.IsActive,
                EmailConfirmed = user.EmailConfirmed,
                PhoneNumberConfirmed = user.PhoneNumberConfirmed,
                TwoFactorEnabled = user.TwoFactorEnabled,
                CreatedAt = user.CreatedAt,
                LastLoginAt = user.LastLoginAt,
                FailedLoginAttempts = user.FailedLoginAttempts,
                LockoutEnd = user.LockoutEnd?.DateTime
            };

            // Include roles if requested
            if (query.IncludeRoles)
            {
                var roles = await _unitOfWork.Roles.GetByUserAsync(query.UserId);
                userDetails.Roles = roles.Select(r => r.Name ?? string.Empty).Where(r => !string.IsNullOrEmpty(r)).ToList();
            }

            // Include permissions if requested
            if (query.IncludePermissions)
            {
                var permissions = await _unitOfWork.Permissions.GetByUserAsync(query.UserId);
                userDetails.Permissions = permissions.Select(p => p.Name ?? string.Empty).Where(p => !string.IsNullOrEmpty(p)).ToList();
            }

            return new UserDetailsResponse
            {
                Success = true,
                Message = "User retrieved successfully",
                User = userDetails
            };
        }
    }
} 
