namespace SecureAuth.APPLICATION.Commands.User
{
    public class UpdateUserCommand : ICommand<bool>
    {
        public string UserId { get; set; } = string.Empty;
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? PhoneNumber { get; set; }
        public string? UserName { get; set; }
        public bool? IsActive { get; set; }
        public string? RoleName { get; set; }
    }
} 
