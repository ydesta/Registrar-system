using System.ComponentModel.DataAnnotations;

namespace SecureAuth.DOMAIN.Models.SignUp
{
    public class RegisterUser
    {
        [Required(ErrorMessage = "First Name is required.")]
        public string? FirstName { get; set; }
        [Required(ErrorMessage = "Middle Name is required.")]
        public string? MiddleName { get; set; }
        [Required(ErrorMessage = "Last Name is required.")]
        public string? LastName { get; set; }
        [Required(ErrorMessage = "Phone Number is required.")]
        public string? PhoneNumber { get; set; }
        [Required(ErrorMessage = "User Name is required.")]
        public string? Username { get; set; }
        [EmailAddress]
        [Required(ErrorMessage = "Email is required.")]
        public string? Email { get; set; }
        [Required(ErrorMessage = "Password is required.")]
        public string? Password { get; set; }
        [Required(ErrorMessage = "Role is required.")]
        public List<string> Roles { get; set; }
    }
}
