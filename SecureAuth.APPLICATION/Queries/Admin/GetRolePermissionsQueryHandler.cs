using SecureAuth.APPLICATION.Queries.Admin;
using SecureAuth.APPLICATION.DTOs.Admin;
using SecureAuth.APPLICATION.Interfaces;

namespace SecureAuth.APPLICATION.Queries.Admin
{
    public class GetRolePermissionsQueryHandler : IQueryHandler<GetRolePermissionsQuery, List<PermissionModel>>
    {
        private readonly IUnitOfWork _unitOfWork;

        public GetRolePermissionsQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<List<PermissionModel>> HandleAsync(GetRolePermissionsQuery query)
        {
            var permissions = await _unitOfWork.RolePermissions.GetPermissionObjectsByRoleIdAsync(query.RoleId);
            
            return permissions.Select(permission => new PermissionModel
            {
                Id = permission.Id,
                Name = permission.Name,
                Description = permission.Description,
                Category = permission.Category,
                IsActive = permission.IsActive
            }).ToList();
        }
    }
} 
