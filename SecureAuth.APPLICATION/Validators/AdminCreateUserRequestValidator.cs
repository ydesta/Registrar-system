using FluentValidation;
using SecureAuth.APPLICATION.DTOs.Authentication;
using SecureAuth.APPLICATION.Helpers;

namespace SecureAuth.APPLICATION.Validators
{
    public class AdminCreateUserRequestValidator : AbstractValidator<AdminCreateUserRequest>
    {
        public AdminCreateUserRequestValidator()
        {
            RuleFor(x => x.FirstName)
                .NotEmpty()
                .MaximumLength(50)
                .Matches(@"^[a-zA-Z\s]+$")
                .WithMessage("First name must contain only letters and spaces");

            RuleFor(x => x.LastName)
                .NotEmpty()
                .MaximumLength(50)
                .Matches(@"^[a-zA-Z\s]+$")
                .WithMessage("Last name must contain only letters and spaces");

            RuleFor(x => x.Email)
                .NotEmpty()
                .EmailAddress()
                .WithMessage("A valid email address is required");

            RuleFor(x => x.PhoneNumber)
                .MaximumLength(20)
                .Must(phone => string.IsNullOrWhiteSpace(phone) || EthiopianPhoneNumber.IsValid(phone))
                .WithMessage(EthiopianPhoneNumber.ErrorMessage);

            RuleFor(x => x.RoleNames)
                .Must(roles => roles == null || roles.All(r => !string.IsNullOrWhiteSpace(r)))
                .WithMessage("Role names cannot be empty or whitespace");

            RuleFor(x => x.RoleNames)
                .Must(roles => roles == null || roles.Count <= 5)
                .WithMessage("A user cannot have more than 5 roles");
        }
    }
}
