using System.ComponentModel.DataAnnotations;

namespace SecureAuth.DOMAIN.Models.Security
{
    public class PasswordResetToken
    {
        public int Id { get; set; }
        
        [Required]
        public string UserId { get; set; } = string.Empty;
        
        [Required]
        public string Token { get; set; } = string.Empty;
        
        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        [Required]
        public DateTime ExpiresAt { get; set; }
        
        public bool IsUsed { get; set; } = false;
        
        public DateTime? UsedAt { get; set; }
        
        // Navigation property
        public ApplicationUser User { get; set; } = null!;
    }
} 