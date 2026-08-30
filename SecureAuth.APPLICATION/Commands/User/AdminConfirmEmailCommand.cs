using System.ComponentModel.DataAnnotations;

namespace SecureAuth.APPLICATION.Commands.User
{
    public class AdminConfirmEmailCommand : ICommand<AdminConfirmEmailResult>
    {
        [Required]
        public string UserId { get; set; } = string.Empty;
    }

    public class AdminConfirmEmailResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public bool EmailConfirmed { get; set; }
    }
}
