import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit {
  forgotPasswordForm: FormGroup;
  isLoading = false;
  emailSent = false;
  emailAddress = '';

  constructor(
    private _notificationService: CustomNotificationService,
    private _router: Router,
    private _fb: FormBuilder,
    private _authService: AuthService
  ) {
    this.forgotPasswordForm = _fb.group({
      email: [null, [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    // Check if user is already authenticated
    this._authService.isAuthenticated().then(isAuth => {
      if (isAuth) {
        this._router.navigate(['/dashboard']);
      }
    });
  }

  submitForm(): void {
    if (this.forgotPasswordForm.valid) {
      this.isLoading = true;
      const email = this.forgotPasswordForm.value.email;
      this.emailAddress = email;

      this._authService.forgotPassword(email).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.emailSent = true;
          this._notificationService.notification(
            'success',
            'Email Sent',
            'If an account with this email exists, you will receive password reset instructions.'
          );
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Forgot password error:', error);
          
          let errorMessage = 'An error occurred while processing your request. Please try again.';
          if (error.error && error.error.message) {
            errorMessage = error.error.message;
          }
          
          this._notificationService.notification('error', 'Error', errorMessage);
        }
      });
    } else {
      Object.values(this.forgotPasswordForm.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  goToLogin(): void {
    this._router.navigate(['/accounts/login']);
  }

  goToRegister(): void {
    this._router.navigate(['/accounts/register']);
  }

  goToHome(): void {
    this._router.navigate(['/']);
  }

  resendEmail(): void {
    this.emailSent = false;
    this.forgotPasswordForm.reset();
  }

  // Getter methods for form validation
  get email() { return this.forgotPasswordForm.get('email'); }
} 