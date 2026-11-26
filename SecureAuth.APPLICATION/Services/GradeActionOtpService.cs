using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.DOMAIN.Models;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace SecureAuth.APPLICATION.Services
{
    public class GradeActionOtpService : IGradeActionOtpService
    {
        public const string TokenAudience = "grade-action";
        public static readonly string[] AllowedPurposes = { "GradeImport", "GradeChangeApproval", "GradeRecordCorrection" };
        private static readonly TimeSpan ProofLifetime = TimeSpan.FromMinutes(3);

        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IOtpService _otpService;
        private readonly IConfiguration _configuration;

        public GradeActionOtpService(
            UserManager<ApplicationUser> userManager,
            IOtpService otpService,
            IConfiguration configuration)
        {
            _userManager = userManager;
            _otpService = otpService;
            _configuration = configuration;
        }

        public async Task<GradeActionOtpResult> SendAsync(string userId, string purpose)
        {
            if (!IsAllowed(purpose))
                return Fail("This grade action is not recognized.");

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null || string.IsNullOrWhiteSpace(user.Email))
                return Fail("The signed-in account has no email for a one-time code.");

            try
            {
                await _otpService.GenerateOtpAsync(user.Id, user.Email, purpose);
            }
            catch (Exception ex)
            {
                return Fail(ex.Message);
            }

            return new GradeActionOtpResult
            {
                Success = true,
                Message = "A one-time code was sent to your email.",
                ExpiresInSeconds = _otpService.LifetimeSeconds,
                EmailHint = MaskEmail(user.Email)
            };
        }

        public async Task<GradeActionOtpResult> VerifyAsync(string userId, string purpose, string otp)
        {
            if (!IsAllowed(purpose))
                return Fail("This grade action is not recognized.");
            if (string.IsNullOrWhiteSpace(otp))
                return Fail("Enter the one-time code.");

            var valid = await _otpService.VerifyOtpAsync(userId, otp.Trim(), purpose);
            if (!valid)
                return Fail("The one-time code is invalid or expired.");

            return new GradeActionOtpResult
            {
                Success = true,
                Message = "Code accepted.",
                Token = CreateProof(userId, purpose)
            };
        }

        private string CreateProof(string userId, string purpose)
        {
            var secret = _configuration["JWT:Secret"] ?? throw new InvalidOperationException("JWT:Secret configuration is missing");
            var issuer = _configuration["JWT:ValidIssuer"];
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: TokenAudience,
                claims: new List<Claim>
                {
                    new Claim(ClaimTypes.NameIdentifier, userId),
                    new Claim("grade_purpose", purpose),
                    new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
                },
                notBefore: DateTime.UtcNow,
                expires: DateTime.UtcNow.Add(ProofLifetime),
                signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature));

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private static bool IsAllowed(string purpose)
        {
            return Array.Exists(AllowedPurposes, item => item == purpose);
        }

        private static GradeActionOtpResult Fail(string message)
        {
            return new GradeActionOtpResult { Success = false, Message = message };
        }

        private static string MaskEmail(string email)
        {
            var parts = email.Split('@');
            if (parts.Length != 2 || string.IsNullOrEmpty(parts[0]) || string.IsNullOrEmpty(parts[1]))
                return "your email";

            var name = parts[0];
            var visible = name[..1];
            return $"{visible}{new string('*', Math.Max(name.Length - 1, 2))}@{parts[1]}";
        }
    }
}
