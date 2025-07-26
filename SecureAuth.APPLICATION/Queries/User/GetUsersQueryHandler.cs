using Microsoft.EntityFrameworkCore;
using SecureAuth.APPLICATION.Queries.User;
using SecureAuth.APPLICATION.DTOs.User;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.DOMAIN.Models;

namespace SecureAuth.APPLICATION.Queries.User
{
    public class GetUsersQueryHandler : IQueryHandler<GetUsersQuery, UsersListResponse>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetUsersQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<UsersListResponse> HandleAsync(GetUsersQuery query)
        {
            try
            {
                // Get all users with filtering
                var usersQuery = _unitOfWork.Users.Query();

                // Apply search filter
                if (!string.IsNullOrEmpty(query.SearchTerm))
                {
                    usersQuery = usersQuery.Where(u => 
                        (u.FirstName != null && u.FirstName.Contains(query.SearchTerm)) ||
                        (u.LastName != null && u.LastName.Contains(query.SearchTerm)) ||
                        (u.Email != null && u.Email.Contains(query.SearchTerm)) ||
                        (u.PhoneNumber != null && u.PhoneNumber.Contains(query.SearchTerm)));
                }

                // Apply role filter
                if (!string.IsNullOrEmpty(query.RoleFilter))
                {
                    var usersInRole = await _unitOfWork.Users.GetByRoleAsync(query.RoleFilter);
                    var userIdsInRole = usersInRole.Select(u => u.Id);
                    usersQuery = usersQuery.Where(u => userIdsInRole.Contains(u.Id));
                }

                // Apply active status filter
                if (query.IsActiveFilter.HasValue)
                {
                    usersQuery = usersQuery.Where(u => u.IsActive == query.IsActiveFilter.Value);
                }

                // Apply sorting
                usersQuery = query.SortBy.ToLower() switch
                {
                    "firstname" => query.SortDescending ? usersQuery.OrderByDescending(u => u.FirstName) : usersQuery.OrderBy(u => u.FirstName),
                    "lastname" => query.SortDescending ? usersQuery.OrderByDescending(u => u.LastName) : usersQuery.OrderBy(u => u.LastName),
                    "email" => query.SortDescending ? usersQuery.OrderByDescending(u => u.Email) : usersQuery.OrderBy(u => u.Email),
                    "createdat" => query.SortDescending ? usersQuery.OrderByDescending(u => u.CreatedAt) : usersQuery.OrderBy(u => u.CreatedAt),
                    "lastloginat" => query.SortDescending ? usersQuery.OrderByDescending(u => u.LastLoginAt) : usersQuery.OrderBy(u => u.LastLoginAt),
                    _ => query.SortDescending ? usersQuery.OrderByDescending(u => u.CreatedAt) : usersQuery.OrderBy(u => u.CreatedAt)
                };

                // Get total count for pagination
                var totalCount = await usersQuery.CountAsync();
                var totalPages = (int)Math.Ceiling((double)totalCount / query.PageSize);

                // Apply pagination
                var users = await usersQuery
                    .Skip((query.Page - 1) * query.PageSize)
                    .Take(query.PageSize)
                    .ToListAsync();

                // Convert to DTOs
                var userDetails = new List<UserDetails>();
                foreach (var user in users)
                {
                    var userDetail = new UserDetails
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

                    // Always include roles
                    var roles = await _unitOfWork.Roles.GetByUserAsync(user.Id);
                    userDetail.Roles = roles.Select(r => r.Name ?? string.Empty).Where(r => !string.IsNullOrEmpty(r)).ToList();

                    userDetails.Add(userDetail);
                }

                return new UsersListResponse
                {
                    Success = true,
                    Message = "Users retrieved successfully",
                    Users = userDetails,
                    TotalCount = totalCount,
                    Page = query.Page,
                    PageSize = query.PageSize,
                    TotalPages = totalPages
                };
            }
            catch (Exception ex)
            {
                return new UsersListResponse
                {
                    Success = false,
                    Message = $"Error retrieving users: {ex.Message}",
                    Users = new List<UserDetails>(),
                    TotalCount = 0,
                    Page = query.Page,
                    PageSize = query.PageSize,
                    TotalPages = 0
                };
            }
        }
    }
} 
