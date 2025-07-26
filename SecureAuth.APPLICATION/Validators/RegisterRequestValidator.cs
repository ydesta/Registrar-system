using FluentValidation;
using SecureAuth.APPLICATION.DTOs.Authentication;

namespace SecureAuth.APPLICATION.Validators
{
    public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
    {
        public RegisterRequestValidator()
        {
            RuleFor(x => x.FirstName)
                .NotEmpty().WithMessage("First name is required")
                .MaximumLength(50).WithMessage("First name cannot exceed 50 characters");

            RuleFor(x => x.LastName)
                .NotEmpty().WithMessage("Last name is required")
                .MaximumLength(50).WithMessage("Last name cannot exceed 50 characters");

            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email is required")
                .EmailAddress().WithMessage("Invalid email format");

            // Password is required for self-registration
            RuleFor(x => x.Password)
                .NotEmpty().When(x => x.IsSelfRegistration)
                .WithMessage("Password is required for self-registration")
                .MinimumLength(8).When(x => x.IsSelfRegistration)
                .WithMessage("Password must be at least 8 characters long")
                .Matches(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]")
                .When(x => x.IsSelfRegistration)
                .WithMessage("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character");

            // Confirm password is required for self-registration
            RuleFor(x => x.ConfirmPassword)
                .NotEmpty().When(x => x.IsSelfRegistration)
                .WithMessage("Please confirm your password")
                .Equal(x => x.Password).When(x => x.IsSelfRegistration)
                .WithMessage("Passwords do not match");

            // Password should not be provided for non-self-registration
            RuleFor(x => x.Password)
                .Empty().When(x => !x.IsSelfRegistration)
                .WithMessage("Password should not be provided for admin-created accounts");

            // Confirm password should not be provided for non-self-registration
            RuleFor(x => x.ConfirmPassword)
                .Empty().When(x => !x.IsSelfRegistration)
                .WithMessage("Confirm password should not be provided for admin-created accounts");

            RuleFor(x => x.PhoneNumber)
                .MaximumLength(20).WithMessage("Phone number cannot exceed 20 characters")
                .Matches(@"^(\+[1-9]\d{1,14}|(09|07)\d{8}|0\d{9})$")
                .When(x => !string.IsNullOrEmpty(x.PhoneNumber))
                .WithMessage("Phone number must be in valid format: +251xxxxxxxxx, +33xxxxxxxxx, 09xxxxxxxx, 07xxxxxxxx, or 0xxxxxxxxx (10 digits)");

            // Role names should not be provided for self-registration
            RuleFor(x => x.RoleNames)
                .Empty().When(x => x.IsSelfRegistration)
                .WithMessage("Roles cannot be specified for self-registration. You will be assigned the 'Applicant' role automatically.");

            RuleFor(x => x.RoleNames)
                .Must(roles => roles == null || roles.All(r => !string.IsNullOrWhiteSpace(r)))
                .When(x => !x.IsSelfRegistration)
                .WithMessage("Role names cannot be empty or whitespace");

            RuleFor(x => x.RoleNames)
                .Must(roles => roles == null || roles.Count <= 5)
                .When(x => !x.IsSelfRegistration)
                .WithMessage("A user cannot have more than 5 roles");
        }
    }
} 