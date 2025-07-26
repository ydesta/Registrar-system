namespace SecureAuth.APPLICATION.Interfaces
{
    public interface IUserProfileService
    {
        Task<List<string>> GetUserRolesAsync(string userId);
        Task<List<string>> GetUserPermissionsAsync(string userId);
    }
} 