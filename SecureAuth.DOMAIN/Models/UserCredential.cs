using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SecureAuth.DOMAIN.Models
{
    public class UserCredential
    {
        public int Id { get; set; }
        public string FirstName { get; set; }
        public string FatherName { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
