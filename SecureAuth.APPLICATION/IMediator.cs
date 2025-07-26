using SecureAuth.APPLICATION.Commands;
using SecureAuth.APPLICATION.Queries;

namespace SecureAuth.APPLICATION.Mediator
{
    public interface IMediator
    {
        Task SendAsync<TCommand>(TCommand command) where TCommand : ICommand;
        Task<TResponse> SendAsync<TCommand, TResponse>(TCommand command) where TCommand : ICommand<TResponse>;
        Task<TResponse> QueryAsync<TQuery, TResponse>(TQuery query) where TQuery : IQuery<TResponse>;
    }
} 
