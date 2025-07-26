using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using FluentValidation;
using SecureAuth.APPLICATION.Mediator;
using SecureAuth.APPLICATION.Commands.Auth;
using SecureAuth.APPLICATION.Queries.Auth;
using SecureAuth.APPLICATION.DTOs.Authentication;
using SecureAuth.APPLICATION.DTOs.Security;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.DOMAIN.Models;
using System.Security.Claims;
using SecureAuth.INFRASTRUCTURE.Data;

namespace SecureAuth.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthenticationController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly IValidator<LoginRequest> _loginValidator;
        private readonly IValidator<RegisterRequest> _registerValidator;
        private readonly IValidator<AdminRegisterRequest> _adminRegisterValidator;
        private readonly IValidator<AdminCreateUserRequest> _adminCreateUserValidator;
        private readonly IAntiforgery _antiforgery;
        private readonly IRateLimitingService _rateLimitingService;

        public AuthenticationController(
            IMediator mediator,
            IValidator<LoginRequest> loginValidator,
            IValidator<RegisterRequest> registerValidator,
            IValidator<AdminRegisterRequest> adminRegisterValidator,
            IValidator<AdminCreateUserRequest> adminCreateUserValidator,
            IAntiforgery antiforgery,
            IRateLimitingService rateLimitingService)
        {
            _mediator = mediator;
            _loginValidator = loginValidator;
            _registerValidator = registerValidator;
            _adminRegisterValidator = adminRegisterValidator;
            _adminCreateUserValidator = adminCreateUserValidator;
            _antiforgery = antiforgery;
            _rateLimitingService = rateLimitingService;
        }

        [HttpGet("health")]
        [AllowAnonymous]
        public IActionResult HealthCheck()
        {
            try
            {
                return Ok(new
                {
                    status = "healthy",
                    timestamp = DateTime.UtcNow,
                    environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production",
                    version = "1.0.0",
                    api = "SecureAuth API"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    status = "unhealthy",
                    timestamp = DateTime.UtcNow,
                    error = ex.Message
                });
            }
        }

        [HttpPost("login")]
        [RateLimit(5, 15)] // 5 login attempts per 15 minutes
        public async Task<ActionResult<LoginResponse>> Login(LoginRequest request)
        {
            try
            {
                var validationResult = await _loginValidator.ValidateAsync(request);
                if (!validationResult.IsValid)
                {
                    return BadRequest(new LoginResponse { Success = false, Message = "Invalid login request" });
                }

                var command = new LoginCommand
                {
                    Email = request.Email,
                    Password = request.Password
                };

                var result = await _mediator.SendAsync<LoginCommand, LoginResponse>(command);
                
                if (result.Success)
                {
                    return Ok(result);
                }
                
                return Unauthorized(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new LoginResponse { Success = false, Message = "An error occurred during login" });
            }
        }

        [HttpPost("register")]
        [RateLimit(3, 60)] // 3 registration attempts per hour
        public async Task<ActionResult<RegisterResponse>> Register(RegisterRequest request)
        {
            try
            {
                var validationResult = await _registerValidator.ValidateAsync(request);
                if (!validationResult.IsValid)
                {
                    return BadRequest(new RegisterResponse { Success = false, Message = "Invalid registration request" });
                }

                var command = new RegisterCommand
                {
                    Email = request.Email,
                    Password = request.Password,
                    ConfirmPassword = request.ConfirmPassword,
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    PhoneNumber = request.PhoneNumber ?? string.Empty,
                    IsSelfRegistration = request.IsSelfRegistration,
                    RoleNames = request.RoleNames ?? new List<string>(),
                    RequireEmailConfirmation = request.RequireEmailConfirmation,
                    RequirePhoneConfirmation = request.RequirePhoneConfirmation
                };

                var result = await _mediator.SendAsync<RegisterCommand, RegisterResponse>(command);
                
                if (result.Success)
                {
                    return Ok(result);
                }
                
                return BadRequest(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new RegisterResponse { Success = false, Message = "An error occurred during registration" });
            }
        }

        [HttpPost("verify-otp")]
        [RateLimit(3, 5)] // 3 OTP verification attempts per 5 minutes
        public async Task<ActionResult<OtpVerifyResponse>> VerifyOtp([FromBody] OtpVerifyRequest request)
        {
            try
            {
                var command = new VerifyOtpCommand
                {
                    Email = request.Email,
                    OtpCode = request.Otp,
                    Purpose = "Login"
                };

                var result = await _mediator.SendAsync<VerifyOtpCommand, OtpVerifyResponse>(command);
                
                if (result.Success)
                {
                    return Ok(result);
                }
                
                return Unauthorized(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new OtpVerifyResponse { Success = false, Message = "An error occurred during OTP verification" });
            }
        }

        [HttpPost("resend-otp")]
        [RateLimit(3, 5)] // 3 OTP resend attempts per 5 minutes
        public async Task<ActionResult<ResendOtpResponse>> ResendOtp([FromBody] ResendOtpRequest request)
        {
            try
            {
                var command = new ResendOtpCommand
                {
                    Email = request.Email,
                    Purpose = "Login"
                };

                var result = await _mediator.SendAsync<ResendOtpCommand, ResendOtpResponse>(command);
                
                if (result.Success)
                {
                    return Ok(result);
                }
                
                return BadRequest(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ResendOtpResponse { Success = false, Message = "An error occurred while resending OTP" });
            }
        }

        [HttpPost("forgot-password")]
        [AllowAnonymous]
        [RateLimit(3, 60)] // 3 forgot password attempts per hour
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            try
            {
                var command = new ForgotPasswordCommand
                {
                    Email = request.Email
                };

                var result = await _mediator.SendAsync<ForgotPasswordCommand, ForgotPasswordResponse>(command);
                
                if (result.Success)
                {
                    return Ok(new { message = result.Message });
                }
                
                return BadRequest(new { message = result.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while processing forgot password request" });
            }
        }

        [HttpPost("reset-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            try
            {
                var command = new ResetPasswordCommand
                {
                    Email = request.Email,
                    Token = request.Token,
                    NewPassword = request.NewPassword,
                    ConfirmPassword = request.ConfirmPassword
                };

                var result = await _mediator.SendAsync<ResetPasswordCommand, ResetPasswordResponse>(command);
                
                if (result.Success)
                {
                    return Ok(new { message = result.Message });
                }
                
                return BadRequest(new { message = result.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while resetting password" });
            }
        }

        [HttpPost("verify-email")]
        [AllowAnonymous]
        public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequest request)
        {
            try
            {
                var command = new VerifyEmailCommand
                {
                    Email = request.Email,
                    Token = request.Token
                };

                var result = await _mediator.SendAsync<VerifyEmailCommand, VerifyEmailResponse>(command);
                
                if (result.Success)
                {
                    return Ok(new { message = result.Message });
                }
                
                return BadRequest(new { message = result.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while verifying email" });
            }
        }

        [HttpGet("verify-email")]
        [AllowAnonymous]
        public async Task<IActionResult> VerifyEmailGet([FromQuery] string email, [FromQuery] string token)
        {
            try
            {
                if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(token))
                {
                    return BadRequest(new { message = "Email and token are required." });
                }

                var command = new VerifyEmailCommand
                {
                    Email = email,
                    Token = token
                };

                var result = await _mediator.SendAsync<VerifyEmailCommand, VerifyEmailResponse>(command);
                
                if (result.Success)
                {
                    return Ok(new { message = result.Message, emailVerified = result.EmailVerified });
                }
                
                return BadRequest(new { message = result.Message, emailVerified = result.EmailVerified });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while verifying email" });
            }
        }

        [HttpPost("resend-verification")]
        [AllowAnonymous]
        public async Task<IActionResult> ResendVerification([FromBody] ResendVerificationRequest request)
        {
            try
            {
                var command = new ResendVerificationCommand
                {
                    Email = request.Email
                };

                var result = await _mediator.SendAsync<ResendVerificationCommand, ResendVerificationResponse>(command);
                
                if (result.Success)
                {
                    return Ok(new { message = result.Message });
                }
                
                return BadRequest(new { message = result.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while resending verification email" });
            }
        }

        [HttpGet("csrf-token")]
        [AllowAnonymous]
        public IActionResult GetCsrfToken()
        {
            var tokens = _antiforgery.GetAndStoreTokens(HttpContext);
            return Ok(new { token = tokens.RequestToken });
        }

        [Authorize]
        [HttpPost("logout")]
        public async Task<ActionResult> Logout()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { message = "User not authenticated" });
                }

                // Revoke refresh tokens
                var tokenService = HttpContext.RequestServices.GetRequiredService<ISecureTokenService>();
                await tokenService.RevokeAllRefreshTokens(userId);

                return Ok(new { message = "Logged out successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred during logout" });
            }
        }

        [HttpPost("beacon-logout")]
        [AllowAnonymous]
        public async Task<ActionResult> BeaconLogout()
        {
            try
            {
                // Handle beacon logout (no authorization required)
                // This is called when browser closes
                var userAgent = Request.Headers["User-Agent"].ToString();
                var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
                
                // Log the beacon logout
                Console.WriteLine($"Beacon logout received from IP: {ipAddress}, User-Agent: {userAgent}");
                
                return Ok(new { message = "Beacon logout received" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred during beacon logout" });
            }
        }

        [Authorize]
        [HttpGet("profile")]
        public async Task<ActionResult<UserProfileResponse>> GetProfile()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new UserProfileResponse { Success = false, Message = "User not authenticated" });
                }

                var query = new GetUserProfileQuery 
                { 
                    UserId = userId,
                    IncludeRoles = true,
                    IncludePermissions = true
                };
                var result = await _mediator.QueryAsync<GetUserProfileQuery, UserProfileResponse>(query);
                
                if (result.Success)
                {
                    return Ok(result);
                }
                
                return NotFound(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new UserProfileResponse { Success = false, Message = "An error occurred while retrieving profile" });
            }
        }
          

        [HttpGet("available-roles")]
        [Authorize(Roles = "Super Admin")]
        public async Task<ActionResult<List<string>>> GetAvailableRoles()
        {
            try
            {
                var roleManager = HttpContext.RequestServices.GetRequiredService<RoleManager<ApplicationRole>>();
                var roles = await roleManager.Roles.Select(r => r.Name).ToListAsync();
                
                return Ok(roles);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while fetching available roles" });
            }
        }

        [HttpPost("admin-create-user")]
        [Authorize(Roles = "Super Admin")]
        public async Task<ActionResult<AdminCreateUserResponse>> AdminCreateUser(AdminCreateUserRequest request)
        {
            try
            {
                var validationResult = await _adminCreateUserValidator.ValidateAsync(request);
                if (!validationResult.IsValid)
                {
                    return BadRequest(new AdminCreateUserResponse { Success = false, Message = "Invalid user creation request" });
                }

                // Get the current user's ID (Super Admin)
                var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(currentUserId))
                {
                    return Unauthorized(new AdminCreateUserResponse { Success = false, Message = "User not authenticated" });
                }

                var command = new AdminCreateUserCommand
                {
                    Email = request.Email,
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    PhoneNumber = request.PhoneNumber ?? string.Empty,
                    RoleNames = request.RoleNames ?? new List<string>(),
                    RequireEmailConfirmation = request.RequireEmailConfirmation,
                    RequirePhoneConfirmation = request.RequirePhoneConfirmation,
                    SendCredentialsEmail = request.SendCredentialsEmail,
                    CreatedByUserId = currentUserId
                };

                var result = await _mediator.SendAsync<AdminCreateUserCommand, AdminCreateUserResponse>(command);
                
                if (result.Success)
                {
                    return Ok(result);
                }
                
                return BadRequest(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new AdminCreateUserResponse { Success = false, Message = "An error occurred during user creation" });
            }
        }

        [HttpPost("change-password")]
        [Authorize]
        public async Task<ActionResult<ChangePasswordResponse>> ChangePassword([FromBody] SecureAuth.APPLICATION.DTOs.Security.ChangePasswordRequest request)
        {
            try
            {
                // Get the current user's ID from claims
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new ChangePasswordResponse { Success = false, Message = "User not authenticated" });
                }

                var command = new ChangePasswordCommand
                {
                    UserId = userId,
                    CurrentPassword = request.CurrentPassword,
                    NewPassword = request.NewPassword,
                    ConfirmPassword = request.ConfirmPassword
                };

                var result = await _mediator.SendAsync<ChangePasswordCommand, ChangePasswordResponse>(command);
                
                if (result.Success)
                {
                    return Ok(result);
                }
                
                return BadRequest(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ChangePasswordResponse { Success = false, Message = "An error occurred while changing password" });
            }
        }

        [HttpPost("reset-rate-limit")]
        [Authorize(Roles = "Super Admin")]
        public async Task<ActionResult> ResetRateLimit()
        {
            try
            {
                // Get the current user's IP or identifier
                var userIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? userIp;
                
                // Reset rate limit for this user
                await _rateLimitingService.ResetRateLimitAsync(userId);
                
                return Ok(new { message = "Rate limit reset successfully", userId = userId });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to reset rate limit", error = ex.Message });
            }
        }

        [HttpPost("extend-session")]
        [Authorize]
        public async Task<ActionResult> ExtendSession()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { message = "User not authenticated" });
                }

                // Get the token service to extend the session
                var tokenService = HttpContext.RequestServices.GetRequiredService<ISecureTokenService>();
                var newToken = await tokenService.ExtendSessionAsync(userId);

                if (string.IsNullOrEmpty(newToken))
                {
                    return BadRequest(new { message = "Failed to extend session" });
                }

                return Ok(new { 
                    message = "Session extended successfully",
                    newToken = newToken,
                    extendedAt = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while extending session", error = ex.Message });
            }
        }

        [HttpGet("session-info")]
        [Authorize]
        public async Task<ActionResult> GetSessionInfo()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { message = "User not authenticated" });
                }

                var tokenService = HttpContext.RequestServices.GetRequiredService<ISecureTokenService>();
                var sessionInfo = await tokenService.GetSessionInfoAsync(userId);

                return Ok(sessionInfo);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while getting session info", error = ex.Message });
            }
        }

        [HttpPost("refresh-token")]
        [AllowAnonymous]
        public async Task<ActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.AccessToken) || string.IsNullOrEmpty(request.RefreshToken))
                {
                    return BadRequest(new { message = "Access token and refresh token are required" });
                }

                // Get the token service to refresh the token
                var tokenService = HttpContext.RequestServices.GetRequiredService<ISecureTokenService>();
                
                // Validate the refresh token
                var principal = tokenService.GetPrincipalFromToken(request.AccessToken);
                var userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { message = "Invalid access token" });
                }
                
                // Validate refresh token
                var isValidRefreshToken = await tokenService.ValidateRefreshToken(userId, request.RefreshToken);
                if (!isValidRefreshToken)
                {
                    return Unauthorized(new { message = "Invalid or expired refresh token" });
                }
                
                // Generate new access token
                var userManager = HttpContext.RequestServices.GetRequiredService<UserManager<ApplicationUser>>();
                var user = await userManager.FindByIdAsync(userId);
                
                if (user == null)
                {
                    return Unauthorized(new { message = "User not found" });
                }
                
                var newAccessToken = await tokenService.GenerateAccessTokenAsync(user);
                
                return Ok(new { 
                    message = "Token refreshed successfully",
                    accessToken = newAccessToken,
                    refreshToken = request.RefreshToken,
                    expiresAt = DateTime.UtcNow.AddMinutes(15) // Token validity from configuration
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while refreshing token", error = ex.Message });
            }
        }

        [HttpGet("debug-user-info")]
        [Authorize]
        public ActionResult GetUserDebugInfo()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var email = User.FindFirst(ClaimTypes.Email)?.Value;
                var name = User.FindFirst(ClaimTypes.Name)?.Value;
                var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();
                
                return Ok(new
                {
                    UserId = userId,
                    Email = email,
                    Name = name,
                    Roles = roles,
                    AllClaims = User.Claims.Select(c => new { Type = c.Type, Value = c.Value }).ToList(),
                    IsInRoleSuperAdmin = User.IsInRole("Super Admin"),
                    IsInRoleAdmin = User.IsInRole("Admin")
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("debug-user-roles")]
        [Authorize]
        public async Task<ActionResult> GetUserRolesDebug()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var email = User.FindFirst(ClaimTypes.Email)?.Value;
                
                // Get roles from JWT claims
                var jwtRoles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();
                
                // Get roles from database
                var userManager = HttpContext.RequestServices.GetRequiredService<UserManager<ApplicationUser>>();
                var user = await userManager.FindByIdAsync(userId);
                var databaseRoles = user != null ? await userManager.GetRolesAsync(user) : new List<string>();
                
                // Get permissions from database
                var context = HttpContext.RequestServices.GetRequiredService<ApplicationDbContext>();
                var permissions = new List<string>();
                
                if (databaseRoles.Any())
                {
                    var roleIds = await context.Roles
                        .Where(r => databaseRoles.Contains(r.Name))
                        .Select(r => r.Id)
                        .ToListAsync();

                    permissions = await context.RolePermissions
                        .Where(rp => roleIds.Contains(rp.RoleId))
                        .Join(context.Permissions, rp => rp.PermissionId, p => p.Id, (rp, p) => p.Name)
                        .Distinct()
                        .ToListAsync();
                }
                
                return Ok(new
                {
                    UserId = userId,
                    Email = email,
                    JwtRoles = jwtRoles,
                    DatabaseRoles = databaseRoles,
                    DatabasePermissions = permissions,
                    AllClaims = User.Claims.Select(c => new { Type = c.Type, Value = c.Value }).ToList(),
                    IsInRoleSuperAdmin = User.IsInRole("Super Admin"),
                    UserExists = user != null,
                    UserActive = user?.IsActive ?? false
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message, stackTrace = ex.StackTrace });
            }
        }
    }
}
