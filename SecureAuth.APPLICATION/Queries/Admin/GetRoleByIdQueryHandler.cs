using Microsoft.AspNetCore.Identity;
using SecureAuth.APPLICATION.Queries.Admin;
using SecureAuth.APPLICATION.DTOs.Admin;
using SecureAuth.DOMAIN.Models;

namespace SecureAuth.APPLICATION.Queries.Admin
{
    public class GetRoleByIdQueryHandler : IQueryHandler<GetRoleByIdQuery, RoleModel>
    {
        private readonly RoleManager<ApplicationRole> _roleManager;

        public GetRoleByIdQueryHandler(RoleManager<ApplicationRole> roleManager)
        {
            _roleManager = roleManager;
        }

        public async Task<RoleModel> HandleAsync(GetRoleByIdQuery query)
        {
            var role = await _roleManager.FindByIdAsync(query.RoleId);
            
            if (role == null)
            {
                return null;
            }

            return new RoleModel
            {
                Id = role.Id,
                Name = role.Name,
                NormalizedName = role.NormalizedName,
                ConcurrencyStamp = role.ConcurrencyStamp
            };
        }
    }
} 
