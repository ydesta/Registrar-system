using SecureAuth.APPLICATION.DTOs;
using SecureAuth.APPLICATION.Commands;

namespace SecureAuth.APPLICATION.Commands.User
{
    public class UpdateUserRoleCommand : ICommand<Result>
    {
        public required string UserId { get; set; }
        public required string Role { get; set; }
        public required string Email { get; set; }
    }
} 