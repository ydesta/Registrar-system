using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using SecureAuth.APPLICATION.Mediator;
using SecureAuth.APPLICATION.Commands.Admin;
using SecureAuth.APPLICATION.Queries.Admin;
using SecureAuth.APPLICATION.DTOs.Admin;

namespace SecureAuth.API.Controllers.Admin
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Super Admin")]
    public class RolePermissionController : ControllerBase
    {
        private readonly IMediator _mediator;

        public RolePermissionController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet("roles")]
        public async Task<ActionResult<List<RoleResponseModel>>> GetRoles()
        {
            try
            {
                var query = new GetRolesQuery();
                var result = await _mediator.QueryAsync<GetRolesQuery, List<RoleModel>>(query);
                
                var roleModels = new List<RoleResponseModel>();
                
                foreach (var role in result)
                {
                    // Get permissions for this role
                    var permissionsQuery = new GetRolePermissionsQuery { RoleId = role.Id };
                    var permissions = await _mediator.QueryAsync<GetRolePermissionsQuery, List<PermissionModel>>(permissionsQuery);
                    
                    var permissionModels = permissions.Select(p => new PermissionResponseModel
                    {
                        Id = p.Id,
                        Name = p.Name,
                        Description = p.Description ?? string.Empty,
                        Category = p.Category ?? string.Empty,
                        RoleCount = 0,
                        CreatedAt = DateTime.UtcNow
                    }).ToList();

                    roleModels.Add(new RoleResponseModel
                {
                    Id = role.Id,
                    Name = role.Name,
                    Description = role.NormalizedName,
                        UserCount = role.UserCount,
                        PermissionCount = permissions.Count,
                        IsActive = true, // TODO: Get from role entity
                        CreatedAt = DateTime.UtcNow,
                        Permissions = permissionModels
                    });
                }

                return Ok(roleModels);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new List<RoleResponseModel>());
            }
        }

        [HttpGet("roles/{id}")]
        public async Task<ActionResult<RoleDetailsResponseModel>> GetRoleDetails(string id)
        {
            try
            {
                var query = new GetRoleByIdQuery { RoleId = id };
                var result = await _mediator.QueryAsync<GetRoleByIdQuery, RoleModel>(query);
                
                if (result != null)
                {
                    return Ok(new RoleDetailsResponseModel
                    {
                        Id = result.Id,
                        Name = result.Name,
                        Description = result.NormalizedName,
                        Permissions = new List<PermissionResponseModel>(),
                        Users = new List<UserResponseModel>(),
                        CreatedAt = DateTime.UtcNow
                    });
                }
                
                return NotFound(new RoleDetailsResponseModel());
            }
            catch (Exception ex)
            {
                return StatusCode(500, new RoleDetailsResponseModel());
            }
        }

        [HttpPost("roles")]
        public async Task<ActionResult<RoleResponseModel>> CreateRole([FromBody] CreateRoleModel model)
        {
            try
            {
                // Get current user ID from JWT claims
                var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
                
                // 1. Create the role and get the new ID
                var createRoleCommand = new CreateRoleCommand
                {
                    Name = model.Name,
                    Description = model.Description,
                    IsActive = model.IsActive,
                    CurrentUserId = currentUserId
                };

                var newRoleId = await _mediator.SendAsync<CreateRoleCommand, string>(createRoleCommand);

                if (string.IsNullOrEmpty(newRoleId))
                    return BadRequest(new { message = "Failed to create role." });

                // 2. Assign permissions if provided
                List<PermissionResponseModel> assignedPermissions = new();
                if (model.PermissionIds != null && model.PermissionIds.Any())
                {
                    // Get current user ID from JWT claims
                 //   var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
                    var assignCommand = new AssignPermissionsToRoleCommand
                    {
                        RoleId = newRoleId,
                        PermissionIds = model.PermissionIds,
                        CurrentUserId = currentUserId
                    };
                    var permissionsAssigned = await _mediator.SendAsync<AssignPermissionsToRoleCommand, bool>(assignCommand);

                    if (!permissionsAssigned)
                        return BadRequest(new { message = "Role created, but failed to assign permissions." });

                    // Optionally, fetch assigned permissions for the response
                    var permissionQuery = new GetRolePermissionsQuery { RoleId = newRoleId };
                    var permissionModels = await _mediator.QueryAsync<GetRolePermissionsQuery, List<PermissionModel>>(permissionQuery);
                    assignedPermissions = permissionModels.Select(p => new PermissionResponseModel
                    {
                        Id = p.Id,
                        Name = p.Name,
                        Description = p.Description ?? string.Empty,
                        Category = p.Category ?? string.Empty,
                        RoleCount = 0,
                        CreatedAt = DateTime.UtcNow
                    }).ToList();
                }

                // 3. Get the created role for the response
                var rolesQuery = new GetRolesQuery();
                var roles = await _mediator.QueryAsync<GetRolesQuery, List<RoleModel>>(rolesQuery);
                var createdRole = roles.FirstOrDefault(r => r.Id == newRoleId);

                if (createdRole == null)
                    return StatusCode(500, new { message = "Role created but not found." });

                // 4. Return the created role with assigned permissions
                return Ok(new RoleResponseModel
                {
                    Id = createdRole.Id,
                    Name = createdRole.Name,
                    Description = createdRole.Description,
                    UserCount = createdRole.UserCount,
                    PermissionCount = assignedPermissions.Count,
                    IsActive = createdRole.IsActive,
                    CreatedAt = createdRole.CreatedAt,
                    Permissions = assignedPermissions
                });
            }
            catch (Exception ex)
            {
                // Log ex
                return StatusCode(500, new { message = "An error occurred while creating the role." });
            }
        }

        [HttpPut("roles/{id}")]
        public async Task<ActionResult<RoleResponseModel>> UpdateRole(string id, [FromBody] UpdateRoleModel model)
        {
            try
            {
                // Get current user ID from JWT claims
                var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
                
                var command = new UpdateRoleCommand
                {
                    Id = id,
                    Name = model.Name,
                    Description = model.Description,
                    IsActive = model.IsActive,
                    CurrentUserId = currentUserId
                };

                var result = await _mediator.SendAsync<UpdateRoleCommand, bool>(command);
                
                if (result)
                {
                    // Get the updated role to get its user count
                    var rolesQuery = new GetRolesQuery();
                    var roles = await _mediator.QueryAsync<GetRolesQuery, List<RoleModel>>(rolesQuery);
                    var updatedRole = roles.FirstOrDefault(r => r.Id == id);
                    
                    return Ok(new RoleResponseModel
                    {
                        Id = id,
                        Name = model.Name,
                        Description = model.Description,
                        UserCount = updatedRole?.UserCount ?? 0,
                        PermissionCount = 0,
                        IsActive = model.IsActive,
                        CreatedAt = DateTime.UtcNow,
                        Permissions = new List<PermissionResponseModel>()
                    });
                }

                return BadRequest(new RoleResponseModel());
            }
            catch (Exception ex)
            {
                return StatusCode(500, new RoleResponseModel());
            }
        }

        [HttpDelete("roles/{id}")]
        public async Task<ActionResult<bool>> DeleteRole(string id)
        {
            try
            {
                // Get current user ID from JWT claims
                var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
                var command = new DeleteRoleCommand 
                { 
                    Id = id,
                    CurrentUserId = currentUserId
                };
                var result = await _mediator.SendAsync<DeleteRoleCommand, bool>(command);
                
                if (result)
                {
                    return Ok(true);
                }

                return BadRequest(false);
            }
            catch (Exception ex)
            {
                return StatusCode(500, false);
            }
        }

        [HttpPost("permissions")]
        public async Task<ActionResult<PermissionResponseModel>> CreatePermission([FromBody] CreatePermissionModel model)
        {
            try
            {
                // TODO: Create CreatePermissionCommand if not exists
                // var command = new CreatePermissionCommand
                // {
                //     Name = model.Name,
                //     Description = model.Description
                // };
                // var result = await _mediator.SendAsync<CreatePermissionCommand, CreatePermissionCommandResponse>(command);
                
                // For now, return not implemented
                return StatusCode(501, new PermissionResponseModel());
            }
            catch (Exception ex)
            {
                return StatusCode(500, new PermissionResponseModel());
            }
        }

        [HttpPost("roles/{roleId}/permissions")]
        public async Task<ActionResult<RolePermissionResponseModel>> AssignPermission(string roleId, [FromBody] AssignPermissionModel model)
        {
            try
            {
                // Get current user ID from JWT claims
                var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
                var command = new AssignPermissionsToRoleCommand
                {
                    RoleId = roleId,
                    PermissionIds = new List<string> { model.PermissionId },
                    CurrentUserId = currentUserId
                };

                var result = await _mediator.SendAsync<AssignPermissionsToRoleCommand, bool>(command);
                
                if (result)
                {
                    return Ok(new RolePermissionResponseModel
                    {
                        RoleId = roleId,
                        PermissionId = model.PermissionId,
                        AssignedAt = DateTime.UtcNow
                    });
                }

                return BadRequest(new RolePermissionResponseModel());
            }
            catch (Exception ex)
            {
                return StatusCode(500, new RolePermissionResponseModel());
            }
        }

        [HttpDelete("roles/{roleId}/permissions/{permissionId}")]
        public async Task<ActionResult<RolePermissionResponseModel>> RemovePermission(string roleId, string permissionId)
        {
            try
            {
                var command = new RemovePermissionsFromRoleCommand
                {
                    RoleId = roleId,
                    PermissionIds = new List<string> { permissionId }
                };

                var result = await _mediator.SendAsync<RemovePermissionsFromRoleCommand, bool>(command);
                
                if (result)
                {
                    return Ok(new RolePermissionResponseModel
                    {
                        RoleId = roleId,
                        PermissionId = permissionId,
                        RemovedAt = DateTime.UtcNow
                    });
                }

                return BadRequest(new RolePermissionResponseModel());
            }
            catch (Exception ex)
            {
                return StatusCode(500, new RolePermissionResponseModel());
            }
        }

        [HttpGet("permissions")]
        public async Task<ActionResult<List<PermissionResponseModel>>> GetPermissions()
        {
            try
            {
                var query = new GetPermissionsQuery();
                var result = await _mediator.QueryAsync<GetPermissionsQuery, List<PermissionModel>>(query);
                
                var permissionModels = result.Select(permission => new PermissionResponseModel
                {
                    Id = permission.Id,
                    Name = permission.Name,
                    Description = permission.Description ?? string.Empty,
                    Category = permission.Category ?? string.Empty,
                    RoleCount = 0,
                    CreatedAt = DateTime.UtcNow
                }).ToList();

                return Ok(permissionModels);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new List<PermissionResponseModel>());
            }
        }

        [HttpGet("roles/{roleId}/permissions")]
        public async Task<ActionResult<List<PermissionResponseModel>>> GetRolePermissions(string roleId)
        {
            try
            {
                var query = new GetRolePermissionsQuery { RoleId = roleId };
                var result = await _mediator.QueryAsync<GetRolePermissionsQuery, List<PermissionModel>>(query);
                
                var permissionModels = result.Select(permission => new PermissionResponseModel
                {
                    Id = permission.Id,
                    Name = permission.Name,
                    Description = permission.Description ?? string.Empty,
                    Category = permission.Category ?? string.Empty,
                    RoleCount = 0,
                    CreatedAt = DateTime.UtcNow
                }).ToList();

                return Ok(permissionModels);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new List<PermissionResponseModel>());
            }
        }

        [HttpPost("roles/{roleId}/permissions/bulk")]
        public async Task<ActionResult<RolePermissionResponseModel>> AssignPermissionsBulk(string roleId, [FromBody] AssignPermissionsBulkModel model)
        {
            try
            {
                // Get current user ID from JWT claims, fallback to request body, then to empty string
                var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                    ?? model.CurrentUserId 
                    ?? string.Empty;
                    
                var command = new AssignPermissionsToRoleCommand
                {
                    RoleId = roleId,
                    PermissionIds = model.PermissionIds,
                    CurrentUserId = currentUserId
                };

                var result = await _mediator.SendAsync<AssignPermissionsToRoleCommand, bool>(command);
                
                if (result)
                {
                    return Ok(new RolePermissionResponseModel
                    {
                        RoleId = roleId,
                        PermissionId = string.Join(",", model.PermissionIds),
                        AssignedAt = DateTime.UtcNow
                    });
                }

                return BadRequest(new RolePermissionResponseModel());
            }
            catch (Exception ex)
            {
                return StatusCode(500, new RolePermissionResponseModel());
            }
        }
    }
} 