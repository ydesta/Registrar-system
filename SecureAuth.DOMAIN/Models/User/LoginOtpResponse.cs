using SecureAuth.DOMAIN.Models;
using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SecureAuth.DOMAIN.Models.User
{
    public class LoginOtpResponse
    {
        public string Token { get; set; } = null;
        public bool IsTwoFactorEnable { get; set; }
        public ApplicationUser User { get; set; } = null;
    }
}
