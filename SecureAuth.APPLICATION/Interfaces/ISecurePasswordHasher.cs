namespace SecureAuth.APPLICATION.Interfaces
{
    public interface ISecurePasswordHasher
    {
        string HashPassword(string password);
        bool VerifyPassword(string password, string hashedPassword);
        bool IsPasswordReused(string userId, string newPassword);
    }
} 
