using SecureAuth.DOMAIN.Models.User;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DaynamicAuthorizationAndAuthentication.Service.Models.Authentication.User
{
    public class LoginResponse
    {
        public TokenType AccessToken { get; set; }
        public TokenType RefreshToken { get; set; }
        public UserInfo User { get; set; }
        public UserPermissions Permissions { get; set; }
    }

    public class UserInfo
    {
        public string Id { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public bool EmailConfirmed { get; set; }
        public bool PhoneNumberConfirmed { get; set; }
        public bool TwoFactorEnabled { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? LastLoginAt { get; set; }
        public List<string> Roles { get; set; } = new List<string>();
    }

    public class UserPermissions
    {
        public List<string> Permissions { get; set; } = new List<string>();
        public Dictionary<string, List<string>> RolePermissions { get; set; } = new Dictionary<string, List<string>>();
        public bool IsSuperAdmin { get; set; }
        public bool HasAdminAccess { get; set; }
    }
}
