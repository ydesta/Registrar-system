using SecureAuth.APPLICATION.Commands;

namespace SecureAuth.APPLICATION.Commands.Admin
{
    public class UpdateRoleCommand : ICommand<bool>
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsActive { get; set; } = true;
        public bool RequiresTwoFactor { get; set; } = false;  // ✅ NEW: Role-based 2FA requirement
        public string? CurrentUserId { get; set; }
    }
} 
