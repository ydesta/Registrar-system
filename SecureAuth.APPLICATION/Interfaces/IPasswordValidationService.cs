namespace SecureAuth.APPLICATION.Interfaces
{
    public interface IPasswordValidationService
    {
        (bool isValid, string message) ValidatePassword(string password);
    }
} 
