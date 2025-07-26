using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SecureAuth.APPLICATION.DTOs.Security;
using SecureAuth.APPLICATION.Interfaces;
using SecureAuth.DOMAIN.Models.Security;
using SecureAuth.INFRASTRUCTURE.Data;

namespace SecureAuth.INFRASTRUCTURE.Services.Repositories
{
    public class PasswordPolicyRepository : IPasswordPolicyRepository
    {
        private readonly ApplicationDbContext _context;

        public PasswordPolicyRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<PasswordPolicyModel?> GetCurrentPolicyAsync()
        {
            var entity = await _context.PasswordPolicies.FirstOrDefaultAsync();
            if (entity == null) return null;
            return new PasswordPolicyModel
            {
                MinLength = entity.MinLength,
                RequireUppercase = entity.RequireUppercase,
                RequireLowercase = entity.RequireLowercase,
                RequireDigit = entity.RequireDigit,
                RequireSpecialChar = entity.RequireSpecialCharacter,
                MaxAgeDays = entity.MaxAgeDays,
                HistoryCount = entity.PasswordHistorySize,
                LockoutThreshold = entity.MaxFailedAttempts,
                LockoutDurationMinutes = entity.LockoutDuration
            };
        }

        public async Task<List<string>> GetPolicyHistoryAsync()
        {
            // Stub: implement actual history logic as needed
            return new List<string>();
        }

        public async Task<bool> UpdatePolicyAsync(PasswordPolicyModel policy)
        {
            var entity = await _context.PasswordPolicies.FirstOrDefaultAsync();
            if (entity == null)
            {
                entity = new PasswordPolicy();
                _context.PasswordPolicies.Add(entity);
            }
            entity.MinLength = policy.MinLength;
            entity.RequireUppercase = policy.RequireUppercase;
            entity.RequireLowercase = policy.RequireLowercase;
            entity.RequireDigit = policy.RequireDigit;
            entity.RequireSpecialCharacter = policy.RequireSpecialChar;
            entity.MaxAgeDays = policy.MaxAgeDays;
            entity.PasswordHistorySize = policy.HistoryCount;
            entity.MaxFailedAttempts = policy.LockoutThreshold;
            entity.LockoutDuration = policy.LockoutDurationMinutes;
            await _context.SaveChangesAsync();
            return true;
        }
    }
} 