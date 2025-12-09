import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { RouteRefreshService } from '../services/route-refresh.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm: FormGroup;
  isLoading = false;
  passwordReset = false;
  token = '';
  email = '';
  passwordVisible = false;
  confirmPasswordVisible = false;

  constructor(
    private _notificationService: CustomNotificationService,
    private _router: Router,
    private _route: ActivatedRoute,
    private _fb: FormBuilder,
    private _authService: AuthService,
    private _routeRefreshService: RouteRefreshService
  ) {
    this.resetPasswordForm = _fb.group({
      newPassword: [null, [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)]],
      confirmPassword: [null, [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Get token and email from URL parameters
    this._route.queryParams.subscribe(params => {
      this.token = params['token'];
      this.email = params['email'];
      if (!this.token || !this.email) {
        this._notificationService.notification('error', 'Invalid Reset Link', 'The password reset link is invalid or has expired.');
        this._routeRefreshService.navigateWithRefresh(['/accounts/forgot-password']);
      }
    });

    // Check if user is already authenticated
    this._authService.isAuthenticated().then(isAuth => {
      if (isAuth) {
        this._routeRefreshService.navigateWithRefresh(['/dashboard']);
      }
    });
  }

  // Custom validator to check if passwords match
  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    if (confirmPassword && confirmPassword.errors) {
      delete confirmPassword.errors['passwordMismatch'];
      if (Object.keys(confirmPassword.errors).length === 0) {
        confirmPassword.setErrors(null);
      }
    }
    
    return null;
  }

  submitForm(): void {
    if (this.resetPasswordForm.valid && this.token && this.email) {
      this.isLoading = true;

      this._authService.resetPassword(
        this.email, 
        this.token, 
        this.resetPasswordForm.value.newPassword, 
        this.resetPasswordForm.value.confirmPassword
      ).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.passwordReset = true;
          this._notificationService.notification(
            'success',
            'Password Reset Successful',
            'Your password has been reset successfully. You can now login with your new password.'
          );
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Reset password error:', error);
          
          let errorMessage = 'An error occurred while resetting your password. Please try again.';
          if (error.error && error.error.message) {
            errorMessage = error.error.message;
          }
          
          this._notificationService.notification('error', 'Reset Failed', errorMessage);
        }
      });
    } else {
      Object.values(this.resetPasswordForm.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  goToLogin(): void {
    console.log('Navigating to login page...');
    this._routeRefreshService.navigateWithRefresh(['/accounts/login']);
  }

  goToForgotPassword(): void {
    console.log('Navigating to forgot password page...');
    this._routeRefreshService.navigateWithRefresh(['/accounts/forgot-password']);
  }

  goToHome(): void {
    console.log('Navigating to home page...');
    this._routeRefreshService.navigateWithRefresh(['/']);
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  toggleConfirmPasswordVisibility(): void {
    this.confirmPasswordVisible = !this.confirmPasswordVisible;
  }

  // Getter methods for form validation
  get newPassword() { return this.resetPasswordForm.get('newPassword'); }
  get confirmPassword() { return this.resetPasswordForm.get('confirmPassword'); }
} 