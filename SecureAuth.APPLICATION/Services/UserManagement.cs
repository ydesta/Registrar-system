using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.DOMAIN.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using DaynamicAuthorizationAndAuthentication.Service.Models;
using DaynamicAuthorizationAndAuthentication.Service.Models.Authentication.User;
using SecureAuth.APPLICATION.DTOs.User;
using SecureAuth.APPLICATION.DTOs.Authentication;
using SecureAuth.APPLICATION.DTOs.Auth;
using SecureAuth.DOMAIN.Models.SignUp;
using SecureAuth.DOMAIN.Models.User;
using SecureAuth.DOMAIN.Models.LogIn;

namespace SecureAuth.APPLICATION.Services
{
    public class UserManagement : IUserManagement
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly RoleManager<ApplicationRole> _roleManager;
        private readonly IConfiguration _configuration;
        private readonly IEmailService _emailService;
        private readonly IRolePermissionRepository _rolePermissionRepository;
        
        public UserManagement(UserManager<ApplicationUser> userManager, RoleManager<ApplicationRole> roleManager, IConfiguration configuration, IEmailService emailService, SignInManager<ApplicationUser> signInManager, IRolePermissionRepository rolePermissionRepository)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _signInManager = signInManager;
            _configuration = configuration;
            _emailService = emailService;
            _rolePermissionRepository = rolePermissionRepository;
        }

        public async Task<ApiResponse<CreateUserResponse>> CreateUserWithTokenAsync(RegisterUser registerUser)
        {
            // Check if user exists
            var userExist = await _userManager.FindByEmailAsync(registerUser.Email);
            if (userExist != null)
            {
                return new ApiResponse<CreateUserResponse> { IsSuccess = false, StatusCode = 403, Message = "User already exists." };
            }

            // Add the user in the database
            ApplicationUser user = new()
            {
                FirstName = registerUser.FirstName,
                MiddleName = registerUser.MiddleName,
                LastName = registerUser.LastName,
                PhoneNumber = registerUser.PhoneNumber,
                Email = registerUser.Email,
                SecurityStamp = Guid.NewGuid().ToString(),
                UserName = registerUser.Username,
                TwoFactorEnabled = true
            };

            var result = await _userManager.CreateAsync(user, registerUser.Password);
            if (result.Succeeded)
            {
                var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
                return new ApiResponse<CreateUserResponse> 
                { 
                    Response = new CreateUserResponse() { User = user, Token = token }, 
                    IsSuccess = true, 
                    StatusCode = 201, 
                    Message = "User Created." 
                };
            }
            else
            {
                return new ApiResponse<CreateUserResponse> { IsSuccess = false, StatusCode = 501, Message = "User Failed to Create." };
            }
        }

        public async Task<ApiResponse<LoginOtpResponse>> GetOtpByLoginAsync(SecureAuth.DOMAIN.Models.LogIn.LoginModel loginModel)
        {
            var user = await _userManager.FindByNameAsync(loginModel.Username);
            if (user != null)
            {
                await _signInManager.SignOutAsync();
                var signInResult = await _signInManager.PasswordSignInAsync(user, loginModel.Password, false, true);
                
                if (signInResult.Succeeded)
                {
                    if (user.TwoFactorEnabled)
                    {
                        var token = await _userManager.GenerateTwoFactorTokenAsync(user, "Email");

                        return new ApiResponse<LoginOtpResponse>
                        {
                            Response = new LoginOtpResponse()
                            {
                                User = user,
                                Token = token,
                                IsTwoFactorEnable = user.TwoFactorEnabled,
                            },
                            StatusCode = 200,
                            IsSuccess = true,
                            Message = $"We have sent an OTP to your Email {user.Email}."
                        };
                    }
                    else
                    {
                        return new ApiResponse<LoginOtpResponse>
                        {
                            Response = new LoginOtpResponse()
                            {
                                User = user,
                                Token = string.Empty,
                                IsTwoFactorEnable = user.TwoFactorEnabled,
                            },
                            StatusCode = 200,
                            IsSuccess = true,
                            Message = "2FA is not enabled."
                        };
                    }
                }
                else
                {
                    return new ApiResponse<LoginOtpResponse>
                    {
                        StatusCode = 401,
                        IsSuccess = false,
                        Message = "Invalid credentials."
                    };
                }
            }
            else
            {
                return new ApiResponse<LoginOtpResponse>
                {
                    StatusCode = 404,
                    IsSuccess = false,
                    Message = "User does not exist."
                };
            }
        }

        public async Task<ApiResponse<DaynamicAuthorizationAndAuthentication.Service.Models.Authentication.User.LoginResponse>> LoginWithTokenAsync(string code, string username)
        {
            var user = await _userManager.FindByNameAsync(username);
            if (user == null)
            {
                return new ApiResponse<DaynamicAuthorizationAndAuthentication.Service.Models.Authentication.User.LoginResponse>
                {
                    IsSuccess = false,
                    StatusCode = 404,
                    Message = "User not found."
                };
            }

            // Verify the OTP code
            var isValid = await _userManager.VerifyTwoFactorTokenAsync(user, "Email", code);
            if (!isValid)
            {
                return new ApiResponse<DaynamicAuthorizationAndAuthentication.Service.Models.Authentication.User.LoginResponse>
                {
                    IsSuccess = false,
                    StatusCode = 401,
                    Message = "Invalid OTP code."
                };
            }

            // Generate login response with tokens
            return await GetJwtTokenAsync(user);
        }

        public async Task<ApiResponse<DaynamicAuthorizationAndAuthentication.Service.Models.Authentication.User.LoginResponse>> RenewAccessTokenAsync(DaynamicAuthorizationAndAuthentication.Service.Models.Authentication.User.LoginResponse tokens)
        {
            try
            {
                // Validate the refresh token
                var principal = GetPrincipalFromExpiredToken(tokens.AccessToken.Token);
                var userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userId))
                {
                    return new ApiResponse<DaynamicAuthorizationAndAuthentication.Service.Models.Authentication.User.LoginResponse>
                    {
                        IsSuccess = false,
                        StatusCode = 401,
                        Message = "Invalid token."
                    };
                }

                var user = await _userManager.FindByIdAsync(userId);
                if (user == null || user.RefreshToken != tokens.RefreshToken.Token || user.RefreshTokenExpiry <= DateTime.UtcNow)
                {
                    return new ApiResponse<DaynamicAuthorizationAndAuthentication.Service.Models.Authentication.User.LoginResponse>
                    {
                        IsSuccess = false,
                        StatusCode = 401,
                        Message = "Invalid refresh token."
                    };
                }

                // Generate new tokens
                return await GetJwtTokenAsync(user);
            }
            catch (Exception)
            {
                return new ApiResponse<DaynamicAuthorizationAndAuthentication.Service.Models.Authentication.User.LoginResponse>
                {
                    IsSuccess = false,
                    StatusCode = 500,
                    Message = "Error renewing access token."
                };
            }
        }

        private async Task<ApiResponse<DaynamicAuthorizationAndAuthentication.Service.Models.Authentication.User.LoginResponse>> GetJwtTokenAsync(ApplicationUser user)
        {
            var authClaims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Name, user.UserName),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var userRoles = await _userManager.GetRolesAsync(user);
            foreach (var role in userRoles)
            {
                authClaims.Add(new Claim(ClaimTypes.Role, role));
            }

            var jwtToken = GetToken(authClaims);
            var refreshToken = GenerateRefreshToken();
            var refreshTokenValidity = int.TryParse(_configuration["JWT:RefreshTokenValidity"], out int validity) ? validity : 7;

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(refreshTokenValidity);

            await _userManager.UpdateAsync(user);

            // Get user permissions
            var userPermissions = await _rolePermissionRepository.GetUserPermissionsAsync(user.Id);
            var rolePermissions = await _rolePermissionRepository.GetUserRolePermissionsAsync(user.Id);
            var isSuperAdmin = await _rolePermissionRepository.IsSuperAdminAsync(user.Id);
            var hasAdminAccess = await _rolePermissionRepository.HasAdminAccessAsync(user.Id);

            return new ApiResponse<DaynamicAuthorizationAndAuthentication.Service.Models.Authentication.User.LoginResponse>
            {                
                Response = new DaynamicAuthorizationAndAuthentication.Service.Models.Authentication.User.LoginResponse()
                {
                    AccessToken = new TokenType()
                    {
                        Token = new JwtSecurityTokenHandler().WriteToken(jwtToken),
                        ExpiryTokenDate = jwtToken.ValidTo
                    },
                    RefreshToken = new TokenType()
                    {
                        Token = user.RefreshToken,
                        ExpiryTokenDate = user.RefreshTokenExpiry ?? DateTime.UtcNow.AddDays(refreshTokenValidity)
                    },
                    User = new DaynamicAuthorizationAndAuthentication.Service.Models.Authentication.User.UserInfo()
                    {
                        Id = user.Id,
                        Email = user.Email ?? string.Empty,
                        FirstName = user.FirstName ?? string.Empty,
                        LastName = user.LastName ?? string.Empty,
                        PhoneNumber = user.PhoneNumber,
                        EmailConfirmed = user.EmailConfirmed,
                        PhoneNumberConfirmed = user.PhoneNumberConfirmed,
                        TwoFactorEnabled = user.TwoFactorEnabled,
                        IsActive = user.IsActive,
                        CreatedAt = user.CreatedAt,
                        LastLoginAt = user.LastLoginAt,
                        Roles = userRoles.ToList()
                    },
                    Permissions = new DaynamicAuthorizationAndAuthentication.Service.Models.Authentication.User.UserPermissions()
                    {
                        Permissions = userPermissions.ToList(),
                        RolePermissions = rolePermissions,
                        IsSuperAdmin = isSuperAdmin,
                        HasAdminAccess = hasAdminAccess
                    }
                },
                StatusCode = 200,
                IsSuccess = true,
                Message = "Token created."
            };
        }

        private JwtSecurityToken GetToken(List<Claim> authClaims)
        {
            var jwtSecret = _configuration["JWT:Secret"] ?? throw new InvalidOperationException("JWT:Secret configuration is missing");
            var authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));

            var token = new JwtSecurityToken(
                issuer: _configuration["JWT:ValidIssuer"],
                audience: _configuration["JWT:ValidAudience"],
                expires: DateTime.Now.AddHours(3),
                claims: authClaims,
                signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha512Signature)
            );

            return token;
        }

        private string GenerateRefreshToken()
        {
            var randomNumber = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            return Convert.ToBase64String(randomNumber);
        }

        private ClaimsPrincipal GetPrincipalFromExpiredToken(string token)
        {
            var tokenValidationParameters = new TokenValidationParameters
            {
                ValidateAudience = false,
                ValidateIssuer = false,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JWT:Secret"])),
                ValidateLifetime = false
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out var securityToken);

            if (!(securityToken is JwtSecurityToken jwtSecurityToken) ||
                !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha512Signature, StringComparison.InvariantCultureIgnoreCase))
            {
                throw new SecurityTokenException("Invalid token");
            }

            return principal;
        }

        public async Task<bool> CreateUserAsync(ApplicationUser user, string password)
        {
            var result = await _userManager.CreateAsync(user, password);
            return result.Succeeded;
        }

        public async Task<bool> UpdateUserAsync(ApplicationUser user)
        {
            var result = await _userManager.UpdateAsync(user);
            return result.Succeeded;
        }

        public async Task<bool> DeleteUserAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return false;

            var result = await _userManager.DeleteAsync(user);
            return result.Succeeded;
        }

        public async Task<ApplicationUser?> GetUserByIdAsync(string userId)
        {
            return await _userManager.FindByIdAsync(userId);
        }

        public async Task<ApplicationUser?> GetUserByEmailAsync(string email)
        {
            return await _userManager.FindByEmailAsync(email);
        }

        public async Task<bool> IsEmailConfirmedAsync(string email)
        {
            var user = await _userManager.FindByEmailAsync(email);
            return user != null && await _userManager.IsEmailConfirmedAsync(user);
        }

        public async Task<string> GenerateEmailConfirmationTokenAsync(ApplicationUser user)
        {
            return await _userManager.GenerateEmailConfirmationTokenAsync(user);
        }

        public async Task<bool> ConfirmEmailAsync(ApplicationUser user, string token)
        {
            var result = await _userManager.ConfirmEmailAsync(user, token);
            return result.Succeeded;
        }

        public async Task<object> GetTwoFactorSetupAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return new { Success = false, Message = "User not found" };
            }

            var isTwoFactorEnabled = await _userManager.GetTwoFactorEnabledAsync(user);
            var twoFactorProviders = await _userManager.GetValidTwoFactorProvidersAsync(user);

            return new
            {
                Success = true,
                UserId = user.Id,
                Email = user.Email,
                IsTwoFactorEnabled = isTwoFactorEnabled,
                AvailableProviders = twoFactorProviders.ToList(),
                Message = "Two-factor setup information retrieved successfully"
            };
        }
    }
}
