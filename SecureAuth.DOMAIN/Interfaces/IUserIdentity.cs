namespace SecureAuth.DOMAIN.Interfaces
{
    public interface IUserIdentity
    {
        string Id { get; }
        string Email { get; }
        string UserName { get; }
    }
} 