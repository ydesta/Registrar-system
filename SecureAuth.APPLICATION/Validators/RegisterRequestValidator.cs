using FluentValidation;
using SecureAuth.APPLICATION.DTOs.Authentication;
using SecureAuth.APPLICATION.Helpers;

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

            RuleFor(x => x.Password)
                .NotEmpty().When(x => x.IsSelfRegistration)
                .WithMessage("Password is required for self-registration")
                .MinimumLength(8).When(x => x.IsSelfRegistration)
                .WithMessage("Password must be at least 8 characters long")
                .Matches(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]")
                .When(x => x.IsSelfRegistration)
                .WithMessage("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character");

            RuleFor(x => x.ConfirmPassword)
                .NotEmpty().When(x => x.IsSelfRegistration)
                .WithMessage("Please confirm your password")
                .Equal(x => x.Password).When(x => x.IsSelfRegistration)
                .WithMessage("Passwords do not match");

            RuleFor(x => x.Password)
                .Empty().When(x => !x.IsSelfRegistration)
                .WithMessage("Password should not be provided for admin-created accounts");

            RuleFor(x => x.ConfirmPassword)
                .Empty().When(x => !x.IsSelfRegistration)
                .WithMessage("Confirm password should not be provided for admin-created accounts");

            RuleFor(x => x.PhoneNumber)
                .NotEmpty().When(x => x.IsSelfRegistration)
                .WithMessage("Phone number is required")
                .MaximumLength(20).WithMessage("Phone number cannot exceed 20 characters")
                .Must(phone => string.IsNullOrWhiteSpace(phone) || EthiopianPhoneNumber.IsValid(phone))
                .WithMessage(EthiopianPhoneNumber.ErrorMessage);

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
