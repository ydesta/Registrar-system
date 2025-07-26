namespace SecureAuth.APPLICATION.Commands
{
    public interface ICommand
    {
    }

    public interface ICommand<TResponse> : ICommand
    {
    }
} 