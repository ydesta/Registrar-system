namespace SecureAuth.APPLICATION.Commands.Security
{
    public class DeleteSecurityThreatCommand : ICommand<bool>
    {
        public string ThreatId { get; set; } = string.Empty;
    }
} 