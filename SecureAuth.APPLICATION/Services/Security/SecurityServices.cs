using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SecureAuth.DOMAIN.Models;
using SecureAuth.DOMAIN.Models.Security;
using Microsoft.AspNetCore.Cryptography.KeyDerivation;
using Microsoft.Extensions.Options;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.APPLICATION.DTOs.Security;

namespace SecureAuth.APPLICATION.Services.Security
{
    public interface ISecurityConfigurationService
    {
        string GetSecureValue(string key);
        string EncryptValue(string value);
        string DecryptValue(string encryptedValue);
        bool ValidateConfiguration();
    }

    public class SecurityConfigurationService : ISecurityConfigurationService
    {
        private readonly IConfiguration _configuration;
        private readonly byte[] _key;
        private readonly byte[] _iv;

        public SecurityConfigurationService(IConfiguration configuration)
        {
            _configuration = configuration;
            _key = Encoding.UTF8.GetBytes(_configuration["Security:EncryptionKey"] ?? throw new InvalidOperationException("Encryption key not found"));
            _iv = Encoding.UTF8.GetBytes(_configuration["Security:EncryptionIV"] ?? throw new InvalidOperationException("Encryption IV not found"));
        }

        public string GetSecureValue(string key)
        {
            var encryptedValue = _configuration[key];
            return encryptedValue != null ? DecryptValue(encryptedValue) : null;
        }

        public string EncryptValue(string value)
        {
            using var aes = Aes.Create();
            aes.Key = _key;
            aes.IV = _iv;

            using var encryptor = aes.CreateEncryptor();
            using var msEncrypt = new MemoryStream();
            using (var csEncrypt = new CryptoStream(msEncrypt, encryptor, CryptoStreamMode.Write))
            using (var swEncrypt = new StreamWriter(csEncrypt))
            {
                swEncrypt.Write(value);
            }

            return Convert.ToBase64String(msEncrypt.ToArray());
        }

        public string DecryptValue(string encryptedValue)
        {
            using var aes = Aes.Create();
            aes.Key = _key;
            aes.IV = _iv;

            using var decryptor = aes.CreateDecryptor();
            using var msDecrypt = new MemoryStream(Convert.FromBase64String(encryptedValue));
            using var csDecrypt = new CryptoStream(msDecrypt, decryptor, CryptoStreamMode.Read);
            using var srDecrypt = new StreamReader(csDecrypt);
            return srDecrypt.ReadToEnd();
        }

        public bool ValidateConfiguration()
        {
            var requiredSettings = new[]
            {
                "Security:EncryptionKey",
                "Security:EncryptionIV",
                "JWT:Secret",
                "EmailConfiguration:Password"
            };

            return requiredSettings.All(key => !string.IsNullOrEmpty(_configuration[key]));
        }
    }

    public class PasswordValidationService : IPasswordValidationService
    {
        private readonly PasswordPolicy _passwordPolicy;

        public PasswordValidationService(IOptions<PasswordPolicy> passwordPolicy)
        {
            _passwordPolicy = passwordPolicy.Value;
        }

        public (bool isValid, string message) ValidatePassword(string password)
        {
            if (string.IsNullOrEmpty(password))
                return (false, "Password cannot be empty");

            if (password.Length < _passwordPolicy.MinLength)
                return (false, $"Password must be at least {_passwordPolicy.MinLength} characters long");

            if (_passwordPolicy.RequireUppercase && !password.Any(char.IsUpper))
                return (false, "Password must contain at least one uppercase letter");

            if (_passwordPolicy.RequireLowercase && !password.Any(char.IsLower))
                return (false, "Password must contain at least one lowercase letter");

            if (_passwordPolicy.RequireDigit && !password.Any(char.IsDigit))
                return (false, "Password must contain at least one number");

            if (_passwordPolicy.RequireSpecialCharacter && !Regex.IsMatch(password, @"[!@#$%^&*(),.?""':{}|<>]"))
                return (false, "Password must contain at least one special character");

            return (true, "Password is valid");
        }
    }

    public class SecurityServices
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<ApplicationRole> _roleManager;
        private readonly IRolePermissionRepository _rolePermissionRepository;
        private readonly IConfiguration _configuration;

        public SecurityServices(
            UserManager<ApplicationUser> userManager,
            RoleManager<ApplicationRole> roleManager,
            IRolePermissionRepository rolePermissionRepository,
            IConfiguration configuration)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _rolePermissionRepository = rolePermissionRepository;
            _configuration = configuration;
        }

        public async Task<bool> HasPermissionAsync(string userId, string permissionName)
        {
            return await _rolePermissionRepository.HasPermissionAsync(userId, permissionName);
        }

        public async Task<IEnumerable<string>> GetUserPermissionsAsync(string userId)
        {
            return await _rolePermissionRepository.GetUserPermissionsAsync(userId);
        }

        public async Task<bool> AssignRoleToUserAsync(string userId, string roleName)
        {
            return await _rolePermissionRepository.AssignRoleToUserAsync(userId, roleName);
        }

        public async Task<bool> RemoveRoleFromUserAsync(string userId, string roleName)
        {
            return await _rolePermissionRepository.RemoveRoleFromUserAsync(userId, roleName);
        }

        public async Task<IEnumerable<string>> GetUserRolesAsync(string userId)
        {
            return await _rolePermissionRepository.GetUserRolesAsync(userId);
        }

        public async Task<bool> CreateRoleAsync(string roleName, string? description = null)
        {
            return await _rolePermissionRepository.CreateRoleAsync(roleName, description);
        }

        public async Task<bool> DeleteRoleAsync(string roleName)
        {
            return await _rolePermissionRepository.DeleteRoleAsync(roleName);
        }

        public async Task<bool> AssignPermissionToRoleAsync(string roleName, string permissionName)
        {
            return await _rolePermissionRepository.AssignPermissionToRoleAsync(roleName, permissionName);
        }

        public async Task<bool> RemovePermissionFromRoleAsync(string roleName, string permissionName)
        {
            return await _rolePermissionRepository.RemovePermissionFromRoleAsync(roleName, permissionName);
        }

        public async Task<IEnumerable<string>> GetRolePermissionsAsync(string roleName)
        {
            return await _rolePermissionRepository.GetRolePermissionsAsync(roleName);
        }

        public async Task<Dictionary<string, List<string>>> GetUserRolePermissionsAsync(string userId)
        {
            return await _rolePermissionRepository.GetUserRolePermissionsAsync(userId);
        }

        public async Task<bool> IsSuperAdminAsync(string userId)
        {
            return await _rolePermissionRepository.IsSuperAdminAsync(userId);
        }

        public async Task<bool> HasAdminAccessAsync(string userId)
        {
            return await _rolePermissionRepository.HasAdminAccessAsync(userId);
        }

        public async Task<List<string>> GetAllowedFeaturesAsync(string userId)
        {
            return await _rolePermissionRepository.GetAllowedFeaturesAsync(userId);
        }
    }

    public class SecurePasswordHasher : ISecurePasswordHasher
    {
        private readonly IPasswordHistoryRepository _passwordHistoryRepository;
        private const int SaltSize = 16;
        private const int HashSize = 32;
        private const int Iterations = 100000;
        private const int PasswordHistorySize = 5;

        public SecurePasswordHasher(IPasswordHistoryRepository passwordHistoryRepository)
        {
            _passwordHistoryRepository = passwordHistoryRepository;
        }

        public string HashPassword(string password)
        {
            byte[] salt = new byte[SaltSize];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(salt);
            }

            byte[] hash = KeyDerivation.Pbkdf2(
                password: password,
                salt: salt,
                prf: KeyDerivationPrf.HMACSHA256,
                iterationCount: Iterations,
                numBytesRequested: HashSize);

            byte[] hashBytes = new byte[SaltSize + HashSize];
            Array.Copy(salt, 0, hashBytes, 0, SaltSize);
            Array.Copy(hash, 0, hashBytes, SaltSize, HashSize);

            return Convert.ToBase64String(hashBytes);
        }

        public bool VerifyPassword(string password, string hashedPassword)
        {
            byte[] hashBytes = Convert.FromBase64String(hashedPassword);

            byte[] salt = new byte[SaltSize];
            Array.Copy(hashBytes, 0, salt, 0, SaltSize);

            byte[] hash = KeyDerivation.Pbkdf2(
                password: password,
                salt: salt,
                prf: KeyDerivationPrf.HMACSHA256,
                iterationCount: Iterations,
                numBytesRequested: HashSize);

            for (int i = 0; i < HashSize; i++)
            {
                if (hashBytes[i + SaltSize] != hash[i])
                    return false;
            }
            return true;
        }

        public bool IsPasswordReused(string userId, string newPassword)
        {
            return _passwordHistoryRepository.IsPasswordInHistoryAsync(userId, newPassword).Result;
        }
    }
} 
