using System.Security.Cryptography;

namespace SecureAuth.APPLICATION.Services
{
    public interface IPasswordGeneratorService
    {
        string GenerateTemporaryPassword(int length = 12);
        string GenerateReadablePassword(int length = 10);
    }

    public class PasswordGeneratorService : IPasswordGeneratorService
    {
        private const string UppercaseLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        private const string LowercaseLetters = "abcdefghijklmnopqrstuvwxyz";
        private const string Digits = "0123456789";
        private const string SpecialCharacters = "!@#$%^&*()_+-=[]{}|;:,.<>?";

        public string GenerateTemporaryPassword(int length = 12)
        {
            if (length < 8)
                throw new ArgumentException("Password length must be at least 8 characters.");

            var password = new char[length];
            var random = new byte[length];

            using (var rng = System.Security.Cryptography.RandomNumberGenerator.Create())
            {
                rng.GetBytes(random);
            }

            // Ensure at least one character from each required category
            password[0] = UppercaseLetters[random[0] % UppercaseLetters.Length];
            password[1] = LowercaseLetters[random[1] % LowercaseLetters.Length];
            password[2] = Digits[random[2] % Digits.Length];
            password[3] = SpecialCharacters[random[3] % SpecialCharacters.Length];

            // Fill the rest with random characters
            var allCharacters = UppercaseLetters + LowercaseLetters + Digits + SpecialCharacters;
            for (int i = 4; i < length; i++)
            {
                password[i] = allCharacters[random[i] % allCharacters.Length];
            }

            // Shuffle the password to make it more random
            for (int i = password.Length - 1; i > 0; i--)
            {
                int j = random[i] % (i + 1);
                (password[i], password[j]) = (password[j], password[i]);
            }

            return new string(password);
        }

        public string GenerateReadablePassword(int length = 10)
        {
            if (length < 8)
                throw new ArgumentException("Password length must be at least 8 characters.");

            var random = new byte[length];
            using (var rng = System.Security.Cryptography.RandomNumberGenerator.Create())
            {
                rng.GetBytes(random);
            }

            var password = new char[length];

            // Ensure at least one character from each required category
            password[0] = UppercaseLetters[random[0] % UppercaseLetters.Length];
            password[1] = LowercaseLetters[random[1] % LowercaseLetters.Length];
            password[2] = Digits[random[2] % Digits.Length];
            password[3] = SpecialCharacters[random[3] % SpecialCharacters.Length];

            // Fill the rest with a mix of letters and numbers (no special chars for readability)
            var readableCharacters = UppercaseLetters + LowercaseLetters + Digits;
            for (int i = 4; i < length; i++)
            {
                password[i] = readableCharacters[random[i] % readableCharacters.Length];
            }

            // Shuffle the password
            for (int i = password.Length - 1; i > 0; i--)
            {
                int j = random[i] % (i + 1);
                (password[i], password[j]) = (password[j], password[i]);
            }

            return new string(password);
        }
    }
} 