using SecureAuth.APPLICATION.Commands;

namespace SecureAuth.APPLICATION.Commands.Admin
{
    public class NormalizeUserPhonesCommand : ICommand<NormalizeUserPhonesResult>
    {
    }

    public class NormalizeUserPhonesResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public int Updated { get; set; }
        public int SkippedInvalid { get; set; }
        public int AlreadyNormalized { get; set; }
    }
}
