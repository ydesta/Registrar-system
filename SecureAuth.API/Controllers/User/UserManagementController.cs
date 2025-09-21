using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SecureAuth.APPLICATION.Commands.User;
using SecureAuth.APPLICATION.DTOs;
using SecureAuth.APPLICATION.DTOs.Authentication;
using SecureAuth.APPLICATION.DTOs.User;
using SecureAuth.APPLICATION.Mediator;
using SecureAuth.APPLICATION.Queries.Auth;
using SecureAuth.APPLICATION.Queries.User;
using System.Security.Claims;

namespace SecureAuth.API.Controllers.User
{
    [ApiController]
    [Route("api/[controller]")]
   // [Authorize]
    public class UserManagementController : ControllerBase
    {
        private readonly IMediator _mediator;

        public UserManagementController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpPost]
        [Authorize(Roles = "Super Admin")]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserCommand command)
        {
            try
            {
                var result = await _mediator.SendAsync<CreateUserCommand, CreateUserCommandResponse>(command);
                
                if (result.Success)
                {
                    return CreatedAtAction(nameof(GetUser), new { id = result.UserId }, result);
                }
                
                return BadRequest(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while creating the user", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetUser(string id, [FromQuery] bool includeRoles = true, [FromQuery] bool includePermissions = false)
        {
            try
            {
                var query = new GetUserByIdQuery
                {
                    UserId = id,
                    IncludeRoles = includeRoles,
                    IncludePermissions = includePermissions
                };

                var result = await _mediator.QueryAsync<GetUserByIdQuery, UserDetailsResponse>(query);
                
                if (result.Success)
                {
                    return Ok(result);
                }
                
                return NotFound(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving the user", error = ex.Message });
            }
        }

        [HttpGet]
        [Authorize(Roles = "Super Admin")]
        public async Task<IActionResult> GetUsers(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? searchTerm = null,
            [FromQuery] string? roleFilter = null,
            [FromQuery] bool? isActiveFilter = null,
            [FromQuery] string? sortBy = "CreatedAt",
            [FromQuery] bool sortDescending = true,
            [FromQuery] bool includeRoles = false)
        {
            try
            {
                var query = new GetUsersQuery
                {
                    Page = page,
                    PageSize = pageSize,
                    SearchTerm = searchTerm,
                    RoleFilter = roleFilter,
                    IsActiveFilter = isActiveFilter,
                    SortBy = sortBy,
                    SortDescending = sortDescending,
                    IncludeRoles = includeRoles
                };

                var result = await _mediator.QueryAsync<GetUsersQuery, UsersListResponse>(query);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving users", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Super Admin")]
        public async Task<IActionResult> UpdateUser(string id, [FromBody] UpdateUserCommand command)
        {
            try
            {
                command.UserId = id;
                var result = await _mediator.SendAsync<UpdateUserCommand, bool>(command);
                
                if (result)
                {
                    return Ok(new { message = "User updated successfully" });
                }
                
                return NotFound(new { message = "User not found" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating the user", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Super Admin")]
        public async Task<IActionResult> DeleteUser(string id, [FromQuery] bool permanentDelete = false)
        {
            try
            {
                var command = new DeleteUserCommand
                {
                    UserId = id,
                    PermanentDelete = permanentDelete
                };

                var result = await _mediator.SendAsync<DeleteUserCommand, bool>(command);
                
                if (result)
                {
                    return Ok(new { message = "User deleted successfully" });
                }
                
                return NotFound(new { message = "User not found" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while deleting the user", error = ex.Message });
            }
        }

        [HttpPut("{id}/status")]
        [Authorize(Roles = "Super Admin")]
        public async Task<IActionResult> UpdateUserStatus(string id, [FromBody] UpdateUserStatusCommand command)
        {
            try
            {
                command.UserId = id;
                var result = await _mediator.SendAsync<UpdateUserStatusCommand, bool>(command);
                
                if (result)
                {
                    return Ok(new { message = "User status updated successfully" });
                }
                
                return NotFound(new { message = "User not found" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating user status", error = ex.Message });
            }
        }

        [HttpPost("users/{id}/regenerate-password")]
        [Authorize(Roles = "Super Admin, Admin")]
        public async Task<IActionResult> RegeneratePassword(string id)
        {
            try
            {
                var command = new RegeneratePasswordCommand { UserId = id };
                var result = await _mediator.SendAsync<RegeneratePasswordCommand, RegeneratePasswordResult>(command);
                if (result.Success)
                    return Ok(new { message = "Password regenerated and sent to user email." });
                return BadRequest(new { message = result.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while regenerating password." });
            }
        }


        [HttpGet("profile")]
        public async Task<ActionResult<UserProfileResponseModel>> GetProfile()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new UserProfileResponseModel());
                }

                var query = new GetUserProfileQuery { UserId = userId };
                var result = await _mediator.QueryAsync<GetUserProfileQuery, UserProfileResponse>(query);
                
                if (result.Success)
                {
                    return Ok(new UserProfileResponseModel
                    {
                        Id = result.User.Id,
                        Email = result.User.Email,
                        PhoneNumber = result.User.PhoneNumber,
                        FirstName = result.User.FirstName,
                        LastName = result.User.LastName,
                        TwoFactorEnabled = result.User.TwoFactorEnabled,
                        EmailConfirmed = result.User.EmailConfirmed,
                        PhoneNumberConfirmed = result.User.PhoneNumberConfirmed,
                        CreatedAt = result.User.CreatedAt,
                        LastLoginAt = result.User.LastLoginAt
                    });
                }
                
                return NotFound(new UserProfileResponseModel());
            }
            catch (Exception ex)
            {
                return StatusCode(500, new UserProfileResponseModel());
            }
        }

        [HttpPut("profile")]
        public async Task<ActionResult<UserProfileResponseModel>> UpdateProfile([FromBody] UpdateProfileModel model)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new UserProfileResponseModel());
                }

                var command = new UpdateUserCommand
                {
                    UserId = userId,
                    FirstName = model.FirstName,
                    LastName = model.LastName,
                    PhoneNumber = model.PhoneNumber
                };

                var result = await _mediator.SendAsync<UpdateUserCommand, bool>(command);
                
                if (result)
                {
                    // Get updated profile
                    var query = new GetUserProfileQuery { UserId = userId };
                    var profileResult = await _mediator.QueryAsync<GetUserProfileQuery, UserProfileResponse>(query);
                    
                    if (profileResult.Success)
                    {
                        return Ok(new UserProfileResponseModel
                        {
                            Id = profileResult.User.Id,
                            Email = profileResult.User.Email,
                            PhoneNumber = profileResult.User.PhoneNumber,
                            FirstName = profileResult.User.FirstName,
                            LastName = profileResult.User.LastName,
                            TwoFactorEnabled = profileResult.User.TwoFactorEnabled,
                            EmailConfirmed = profileResult.User.EmailConfirmed,
                            PhoneNumberConfirmed = profileResult.User.PhoneNumberConfirmed,
                            CreatedAt = profileResult.User.CreatedAt,
                            LastLoginAt = profileResult.User.LastLoginAt
                        });
                    }
                }
                
                return BadRequest(new UserProfileResponseModel());
            }
            catch (Exception ex)
            {
                return StatusCode(500, new UserProfileResponseModel());
            }
        }

        [HttpPut("email")]
        public async Task<ActionResult<UserProfileResponseModel>> UpdateEmail([FromBody] UpdateEmailModel model)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new UserProfileResponseModel());
                }

                var command = new UpdateEmailCommand
                {
                    UserId = userId,
                    NewEmail = model.NewEmail,
                    Password = model.Password
                };
                
                var result = await _mediator.SendAsync<UpdateEmailCommand, UpdateEmailResponse>(command);
                
                if (result.Success)
                {
                    // Get updated profile
                    var query = new GetUserProfileQuery { UserId = userId };
                    var profileResult = await _mediator.QueryAsync<GetUserProfileQuery, UserProfileResponse>(query);
                    
                    if (profileResult.Success)
                    {
                        return Ok(new UserProfileResponseModel
                        {
                            Id = profileResult.User.Id,
                            Email = profileResult.User.Email,
                            PhoneNumber = profileResult.User.PhoneNumber,
                            FirstName = profileResult.User.FirstName,
                            LastName = profileResult.User.LastName,
                            TwoFactorEnabled = profileResult.User.TwoFactorEnabled,
                            EmailConfirmed = profileResult.User.EmailConfirmed,
                            PhoneNumberConfirmed = profileResult.User.PhoneNumberConfirmed,
                            CreatedAt = profileResult.User.CreatedAt,
                            LastLoginAt = profileResult.User.LastLoginAt
                        });
                    }
                }
                
                return BadRequest(new { message = result.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new UserProfileResponseModel());
            }
        }

        [HttpPut("username")]
        public async Task<ActionResult<UserProfileResponseModel>> UpdateUsername([FromBody] UpdateUsernameModel model)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new UserProfileResponseModel());
                }

                var command = new UpdateUserCommand
                {
                    UserId = userId,
                    UserName = model.NewUsername
                };

                var result = await _mediator.SendAsync<UpdateUserCommand, bool>(command);
                
                if (result)
                {
                    // Get updated profile
                    var query = new GetUserProfileQuery { UserId = userId };
                    var profileResult = await _mediator.QueryAsync<GetUserProfileQuery, UserProfileResponse>(query);
                    
                    if (profileResult.Success)
                    {
                        return Ok(new UserProfileResponseModel
                        {
                            Id = profileResult.User.Id,
                            Email = profileResult.User.Email,
                            PhoneNumber = profileResult.User.PhoneNumber,
                            FirstName = profileResult.User.FirstName,
                            LastName = profileResult.User.LastName,
                            TwoFactorEnabled = profileResult.User.TwoFactorEnabled,
                            EmailConfirmed = profileResult.User.EmailConfirmed,
                            PhoneNumberConfirmed = profileResult.User.PhoneNumberConfirmed,
                            CreatedAt = profileResult.User.CreatedAt,
                            LastLoginAt = profileResult.User.LastLoginAt
                        });
                    }
                }
                
                return BadRequest(new { message = "Failed to update username. Username may already be in use." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new UserProfileResponseModel());
            }
        }

        [HttpPut("phone")]
        public async Task<ActionResult<UserProfileResponseModel>> UpdatePhone([FromBody] UpdatePhoneModel model)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new UserProfileResponseModel());
                }

                // TODO: Create UpdatePhoneCommand if not exists
                // var command = new UpdatePhoneCommand
                // {
                //     UserId = userId,
                //     NewPhoneNumber = model.NewPhoneNumber,
                //     Password = model.Password
                // };
                // var result = await _mediator.SendAsync<UpdatePhoneCommand, bool>(command);
                
                // For now, return not implemented
                return StatusCode(501, new UserProfileResponseModel());
            }
            catch (Exception ex)
            {
                return StatusCode(500, new UserProfileResponseModel());
            }
        }

        [HttpPost("enable-2fa")]
        public async Task<ActionResult<TwoFactorSetupModel>> EnableTwoFactor()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new TwoFactorSetupModel());
                }

                var query = new GetTwoFactorSetupQuery { UserId = userId };
                var result = await _mediator.QueryAsync<GetTwoFactorSetupQuery, TwoFactorSetupModel>(query);
                
                if (result.Success)
                {
                    return Ok(result);
                }
                
                return BadRequest(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new TwoFactorSetupModel());
            }
        }

        [HttpPost("disable-2fa")]
        public async Task<ActionResult<UserProfileResponseModel>> DisableTwoFactor([FromBody] VerifyTwoFactorModel model)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new UserProfileResponseModel());
                }

                // TODO: Create DisableTwoFactorCommand if not exists
                // var command = new DisableTwoFactorCommand
                // {
                //     UserId = userId,
                //     Code = model.Code
                // };
                // var result = await _mediator.SendAsync<DisableTwoFactorCommand, bool>(command);
                
                // For now, return not implemented
                return StatusCode(501, new UserProfileResponseModel());
            }
            catch (Exception ex)
            {
                return StatusCode(500, new UserProfileResponseModel());
            }
        }

        [HttpPost("UpdateRole/user-role")]
      //  [Authorize(Roles = "Super Admin")]
        public async Task<IActionResult> UpdateRole([FromBody] UpdateUserRoleCommand command)
        {
            try
            {
                if (command == null || string.IsNullOrEmpty(command.UserId) || string.IsNullOrEmpty(command.Role))
                    return BadRequest(new { message = "Invalid request. UserId and Role are required." });

                var result = await _mediator.SendAsync<UpdateUserRoleCommand, Result>(command);
                if (!result.IsSuccess)
                    return StatusCode(500, new { message = result.ErrorMessage });
                var commandUserupdate = new AdminUpdateEmailCommand
                {
                    UserId = command.UserId,
                    NewEmail = command.Email
                };

                var resultUserUpdate = await _mediator.SendAsync<AdminUpdateEmailCommand, UpdateEmailResponse>(commandUserupdate);
                if (!resultUserUpdate.Success)
                    return StatusCode(500, new { message = result.ErrorMessage });
                return Ok(new { success = true, message = "User role and User Name updated successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating user role", error = ex.Message });
            }
        }

        [HttpPut("admin/{id}/username")]
        [Authorize(Roles = "Super Admin")]
        public async Task<IActionResult> AdminUpdateUsername(string id, [FromBody] UpdateUsernameModel model)
        {
            try
            {
                var command = new UpdateUserCommand
                {
                    UserId = id,
                    UserName = model.NewUsername
                };

                var result = await _mediator.SendAsync<UpdateUserCommand, bool>(command);
                
                if (result)
                {
                    return Ok(new { message = "Username updated successfully" });
                }
                
                return BadRequest(new { message = "Failed to update username. Username may already be in use." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating username", error = ex.Message });
            }
        }

        [HttpPut("admin/{id}/email")]
        //[Authorize(Roles = "Super Admin")]
        public async Task<IActionResult> AdminUpdateEmail(string id, [FromBody] AdminUpdateEmailModel model)
        {
            try
            {
                var command = new AdminUpdateEmailCommand
                {
                    UserId = id,
                    NewEmail = model.NewEmail
                };
                
                var result = await _mediator.SendAsync<AdminUpdateEmailCommand, UpdateEmailResponse>(command);
                
                if (result.Success)
                {
                    return Ok(new { message = result.Message });
                }
                
                return BadRequest(new { message = result.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating email", error = ex.Message });
            }
        }

        [HttpGet("health")]
        public IActionResult HealthCheck()
        {
            return Ok(new { 
                message = "UserManagement API is running", 
                timestamp = DateTime.Now,
                version = "1.0.0"
            });
        }

        [HttpGet("credentials")]
        // [Authorize(Roles = "Super Admin, Academic Director")] // Temporarily disabled for testing
        public async Task<IActionResult> GetUserCredentials(
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? emailFilter = null,
            [FromQuery] string? sortBy = "CreatedAt",
            [FromQuery] bool sortDescending = true)
        {
            try
            {
                Console.WriteLine($"GetUserCredentials called with params: page={page}, pageSize={pageSize}, sortBy={sortBy}");
                Console.WriteLine($"User.Identity.IsAuthenticated: {User.Identity?.IsAuthenticated}");
                Console.WriteLine($"User.Identity.Name: {User.Identity?.Name}");
                
                // Log user claims
                foreach (var claim in User.Claims)
                {
                    Console.WriteLine($"Claim: {claim.Type} = {claim.Value}");
                }
                var query = new GetUserCredentialsQuery
                {
                    FromDate = fromDate,
                    ToDate = toDate,
                    Page = page,
                    PageSize = pageSize,
                    EmailFilter = emailFilter,
                    SortBy = sortBy,
                    SortDescending = sortDescending
                };

                var result = await _mediator.QueryAsync<GetUserCredentialsQuery, GetUserCredentialsResponse>(query);
                
                if (result.Success)
                {
                    return Ok(result);
                }
                
                return BadRequest(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving user credentials", error = ex.Message });
            }
        }
    }
} 