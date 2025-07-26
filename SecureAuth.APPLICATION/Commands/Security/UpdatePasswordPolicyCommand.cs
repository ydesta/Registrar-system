using SecureAuth.APPLICATION.DTOs.Security;

namespace SecureAuth.APPLICATION.Commands.Security
{
    public class UpdatePasswordPolicyCommand : ICommand<bool>
    {
        public PasswordPolicyModel PasswordPolicy { get; set; } = new();
    }
} 
