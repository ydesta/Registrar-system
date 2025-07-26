using Microsoft.AspNetCore.Identity;
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
            var roles = _roleManager.Roles.ToList();
            var roleModels = new List<RoleModel>();
            
            foreach (var role in roles)
            {
                var userCount = await _roleRepository.GetUserCountAsync(role.Name);
                
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
