using System.ComponentModel.DataAnnotations;
using SecureAuth.APPLICATION.Commands;

namespace SecureAuth.APPLICATION.Commands.User
{
    public class AdminUpdateUserRolesCommand : ICommand<AdminUpdateUserRolesResult>
    {
        [Required]
        public string UserId { get; set; } = string.Empty;

        public List<string> Roles { get; set; } = new();
    }

    public class AdminUpdateUserRolesResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public class AdminUpdateUserRolesRequest
    {
        public List<string> Roles { get; set; } = new();
    }
}
