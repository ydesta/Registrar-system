using SecureAuth.APPLICATION.DTOs;
using SecureAuth.APPLICATION.Commands;

namespace SecureAuth.APPLICATION.Commands.User
{
    public class UpdateUserRoleCommand : ICommand<Result>
    {
        public string UserId { get; set; }
        public string Role { get; set; }
    }
} 