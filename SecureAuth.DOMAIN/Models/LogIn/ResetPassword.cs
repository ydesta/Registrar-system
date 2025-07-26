﻿using System.ComponentModel.DataAnnotations;

namespace DaynamicAuthorizationAndAuthentication.Service.Models.Authentication.LogIn
{
    public class ResetPassword
    {
        [Required]
        public string Password { get; set; } = null;
        [Compare("Password", ErrorMessage = "The password and confirmation password do not match.")]
        public string ConfirmPassword { get; set; } = null;
        public string Email { get; set; } = null;
        public string Token { get; set; } = null;
    }
}
