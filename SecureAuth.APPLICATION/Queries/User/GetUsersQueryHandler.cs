using Microsoft.EntityFrameworkCore;
using SecureAuth.APPLICATION.Queries.User;
using SecureAuth.APPLICATION.DTOs.User;
using SecureAuth.APPLICATION.Helpers;
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
                var usersQuery = _unitOfWork.Users.Query().AsNoTracking();

                if (!string.IsNullOrEmpty(query.SearchTerm))
                {
                    var searchTerm = query.SearchTerm.ToLower();
                    usersQuery = usersQuery.Where(u =>
                        (u.FirstName != null && u.FirstName.ToLower().Contains(searchTerm)) ||
                        (u.LastName != null && u.LastName.ToLower().Contains(searchTerm)) ||
                        (u.Email != null && u.Email.ToLower().Contains(searchTerm)) ||
                        (u.PhoneNumber != null && u.PhoneNumber.ToLower().Contains(searchTerm)));
                }

                if (!string.IsNullOrEmpty(query.RoleFilter))
                {
                    var usersInRole = await _unitOfWork.Users.GetByRoleAsync(query.RoleFilter);
                    var userIdsInRole = usersInRole.Select(u => u.Id);
                    usersQuery = usersQuery.Where(u => userIdsInRole.Contains(u.Id));
                }

                if (query.IsActiveFilter.HasValue)
                {
                    usersQuery = usersQuery.Where(u => u.IsActive == query.IsActiveFilter.Value);
                }

                var sortBy = (query.SortBy ?? "CreatedAt").Trim().ToLowerInvariant();
                List<ApplicationUser> users;
                int totalCount;

                if (sortBy is "roles" or "role" or "rolename")
                {
                    var filteredUsers = await usersQuery.ToListAsync();
                    totalCount = filteredUsers.Count;
                    var roleMap = await _unitOfWork.Roles.GetPrimaryRoleNamesByUserIdsAsync(filteredUsers.Select(u => u.Id));

                    var ordered = query.SortDescending
                        ? filteredUsers
                            .OrderByDescending(u => roleMap.TryGetValue(u.Id, out var role) ? role : string.Empty)
                            .ThenBy(u => u.FirstName)
                            .ThenBy(u => u.LastName)
                        : filteredUsers
                            .OrderBy(u => roleMap.TryGetValue(u.Id, out var role) ? role : string.Empty)
                            .ThenBy(u => u.FirstName)
                            .ThenBy(u => u.LastName);

                    users = ordered
                        .Skip((query.Page - 1) * query.PageSize)
                        .Take(query.PageSize)
                        .ToList();
                }
                else
                {
                    usersQuery = sortBy switch
                    {
                        "fullname" or "name" => query.SortDescending
                            ? usersQuery.OrderByDescending(u => u.FirstName).ThenByDescending(u => u.LastName)
                            : usersQuery.OrderBy(u => u.FirstName).ThenBy(u => u.LastName),
                        "firstname" => query.SortDescending
                            ? usersQuery.OrderByDescending(u => u.FirstName)
                            : usersQuery.OrderBy(u => u.FirstName),
                        "lastname" => query.SortDescending
                            ? usersQuery.OrderByDescending(u => u.LastName)
                            : usersQuery.OrderBy(u => u.LastName),
                        "email" => query.SortDescending
                            ? usersQuery.OrderByDescending(u => u.Email)
                            : usersQuery.OrderBy(u => u.Email),
                        "phone" or "phonenumber" => query.SortDescending
                            ? usersQuery.OrderByDescending(u => u.PhoneNumber)
                            : usersQuery.OrderBy(u => u.PhoneNumber),
                        "status" or "isactive" => query.SortDescending
                            ? usersQuery.OrderByDescending(u => u.IsActive)
                            : usersQuery.OrderBy(u => u.IsActive),
                        "emailconfirmed" or "verification" => query.SortDescending
                            ? usersQuery.OrderByDescending(u => u.EmailConfirmed)
                            : usersQuery.OrderBy(u => u.EmailConfirmed),
                        "lastloginat" or "activity" => query.SortDescending
                            ? usersQuery.OrderByDescending(u => u.LastLoginAt)
                            : usersQuery.OrderBy(u => u.LastLoginAt),
                        _ => query.SortDescending
                            ? usersQuery.OrderByDescending(u => u.CreatedAt)
                            : usersQuery.OrderBy(u => u.CreatedAt)
                    };

                    totalCount = await usersQuery.CountAsync();
                    users = await usersQuery
                        .Skip((query.Page - 1) * query.PageSize)
                        .Take(query.PageSize)
                        .ToListAsync();
                }

                var totalPages = (int)Math.Ceiling((double)totalCount / query.PageSize);
                var userDetails = new List<UserDetails>();
                foreach (var user in users)
                {
                    var userDetail = new UserDetails
                    {
                        Id = user.Id,
                        Email = user.Email ?? string.Empty,
                        PhoneNumber = EthiopianPhoneNumber.NormalizeOptional(user.PhoneNumber) ?? string.Empty,
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
