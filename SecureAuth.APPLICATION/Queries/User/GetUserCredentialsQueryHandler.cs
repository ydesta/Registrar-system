using Microsoft.EntityFrameworkCore;
using SecureAuth.APPLICATION.DTOs.User;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.APPLICATION.Queries;
using SecureAuth.DOMAIN.Models;

namespace SecureAuth.APPLICATION.Queries.User
{
    public class GetUserCredentialsQueryHandler : IQueryHandler<GetUserCredentialsQuery, GetUserCredentialsResponse>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetUserCredentialsQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<GetUserCredentialsResponse> HandleAsync(GetUserCredentialsQuery query)
        {
            try
            {
                Console.WriteLine($"GetUserCredentialsQueryHandler.HandleAsync called with query: {System.Text.Json.JsonSerializer.Serialize(query)}");
                
                var userCredentialsQuery = _unitOfWork.UserCredentials.Query();
                Console.WriteLine($"UserCredentials query created, checking if UserCredential table exists...");

                // Apply date filters
                if (query.FromDate.HasValue)
                {
                    userCredentialsQuery = userCredentialsQuery.Where(uc => uc.CreatedAt >= query.FromDate.Value);
                }

                if (query.ToDate.HasValue)
                {
                    userCredentialsQuery = userCredentialsQuery.Where(uc => uc.CreatedAt <= query.ToDate.Value);
                }

                // Apply email filter
                if (!string.IsNullOrEmpty(query.EmailFilter))
                {
                    userCredentialsQuery = userCredentialsQuery.Where(uc => 
                        uc.Email.Contains(query.EmailFilter));
                }

                // Apply sorting
                switch (query.SortBy?.ToLower())
                {
                    case "email":
                        userCredentialsQuery = query.SortDescending 
                            ? userCredentialsQuery.OrderByDescending(uc => uc.Email)
                            : userCredentialsQuery.OrderBy(uc => uc.Email);
                        break;
                    case "createdat":
                    default:
                        userCredentialsQuery = query.SortDescending 
                            ? userCredentialsQuery.OrderByDescending(uc => uc.CreatedAt)
                            : userCredentialsQuery.OrderBy(uc => uc.CreatedAt);
                        break;
                }

                // Get total count
                var totalCount = await userCredentialsQuery.CountAsync();
                Console.WriteLine($"Total UserCredentials count: {totalCount}");

                // Apply pagination
                var userCredentials = await userCredentialsQuery
                    .Skip((query.Page - 1) * query.PageSize)
                    .Take(query.PageSize)
                    .Select(uc => new UserCredentialDto
                    {
                        Id = uc.Id,
                        Email = uc.Email,
                        Password = uc.Password,
                        CreatedAt = uc.CreatedAt
                    })
                    .ToListAsync();

                Console.WriteLine($"Retrieved {userCredentials.Count} UserCredentials");

                return new GetUserCredentialsResponse
                {
                    Success = true,
                    Message = "User credentials retrieved successfully",
                    UserCredentials = userCredentials,
                    TotalCount = totalCount,
                    Page = query.Page,
                    PageSize = query.PageSize
                };
            }
            catch (Exception ex)
            {
                return new GetUserCredentialsResponse
                {
                    Success = false,
                    Message = "An error occurred while retrieving user credentials",
                 //   ErrorMessage = ex.Message
                };
            }
        }
    }
}
