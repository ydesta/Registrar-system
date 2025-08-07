using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SecureAuth.APPLICATION.Queries.Admin;
using SecureAuth.APPLICATION.DTOs.Admin;
using SecureAuth.DOMAIN.Models;
using SecureAuth.APPLICATION.Interfaces;

namespace SecureAuth.APPLICATION.Queries.Admin
{
    public class GetRolesQueryHandler : IQueryHandler<GetRolesQuery, List<RoleModel>>
    {
        private readonly RoleManager<ApplicationRole> _roleManager;
        private readonly IRoleRepository _roleRepository;

        public GetRolesQueryHandler(RoleManager<ApplicationRole> roleManager, IRoleRepository roleRepository)
        {
            _roleManager = roleManager;
            _roleRepository = roleRepository;
        }

        public async Task<List<RoleModel>> HandleAsync(GetRolesQuery query)
        {
            // Get all roles with AsNoTracking for better performance
            var roles = await _roleManager.Roles
                .AsNoTracking()
                .ToListAsync();
            
            var roleModels = new List<RoleModel>();
            
            // Batch the user count queries to avoid N+1 problem
            var roleNames = roles.Select(r => r.Name).ToList();
            var userCounts = await _roleRepository.GetUserCountsForRolesAsync(roleNames);
            
            foreach (var role in roles)
            {
                var userCount = userCounts.TryGetValue(role.Name, out var count) ? count : 0;
                
                roleModels.Add(new RoleModel
                {
                    Id = role.Id,
                    Name = role.Name,
                    NormalizedName = role.NormalizedName,
                    ConcurrencyStamp = role.ConcurrencyStamp,
                    UserCount = userCount
                });
            }
            
            return roleModels;
        }
    }
} 
