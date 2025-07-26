namespace SecureAuth.APPLICATION.Commands.User
{
    public class RegeneratePasswordCommand : ICommand<RegeneratePasswordResult>
    {
        public string UserId { get; set; }
    }

    public class RegeneratePasswordResult
    {
        public bool Success { get; set; }
        public string Message { get; set; }
    }
} 