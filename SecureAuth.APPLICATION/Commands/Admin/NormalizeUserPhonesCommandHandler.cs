using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SecureAuth.APPLICATION.Commands;
using SecureAuth.APPLICATION.Helpers;
using SecureAuth.DOMAIN.Models;

namespace SecureAuth.APPLICATION.Commands.Admin
{
    public class NormalizeUserPhonesCommandHandler : ICommandHandler<NormalizeUserPhonesCommand, NormalizeUserPhonesResult>
    {
        private readonly UserManager<ApplicationUser> _userManager;

        public NormalizeUserPhonesCommandHandler(UserManager<ApplicationUser> userManager)
        {
            _userManager = userManager;
        }

        public async Task<NormalizeUserPhonesResult> HandleAsync(NormalizeUserPhonesCommand command)
        {
            var updated = 0;
            var skippedInvalid = 0;
            var alreadyNormalized = 0;

            var users = await _userManager.Users
                .Where(u => u.PhoneNumber != null && u.PhoneNumber != "")
                .ToListAsync();

            foreach (var user in users)
            {
                if (!EthiopianPhoneNumber.TryNormalize(user.PhoneNumber, out var normalized) || normalized == null)
                {
                    skippedInvalid++;
                    continue;
                }

                if (normalized == user.PhoneNumber)
                {
                    alreadyNormalized++;
                    continue;
                }

                user.PhoneNumber = normalized;
                var result = await _userManager.UpdateAsync(user);
                if (result.Succeeded)
                {
                    updated++;
                }
                else
                {
                    skippedInvalid++;
                }
            }

            return new NormalizeUserPhonesResult
            {
                Success = true,
                Message = "User phone normalization completed.",
                Updated = updated,
                SkippedInvalid = skippedInvalid,
                AlreadyNormalized = alreadyNormalized
            };
        }
    }
}
