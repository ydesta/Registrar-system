import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { RouteRefreshService } from '../services/route-refresh.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {
  forgotPasswordForm: FormGroup;
  isLoading = false;
  emailSent = false;
  emailAddress = '';
  private redirectTimer: any;
  redirectCountdown = 0;

  constructor(
    private _notificationService: CustomNotificationService,
    private _router: Router,
    private _fb: FormBuilder,
    private _authService: AuthService,
    private _routeRefreshService: RouteRefreshService
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

  ngOnDestroy(): void {
    // Clear the redirect timer/interval if component is destroyed
    if (this.redirectTimer) {
      clearInterval(this.redirectTimer);
    }
  }

  submitForm(): void {
    if (this.forgotPasswordForm.valid) {
      this.isLoading = true;
      const email = this.forgotPasswordForm.value.email;
      this.emailAddress = email;

      this._authService.forgotPassword(email).subscribe({
        next: (response) => {
          this.isLoading = false;
          
          // Check if the request was successful and email was sent
          if (response.success === true && response.emailSent === true) {
            this.emailSent = true;
            this._notificationService.notification(
              'success',
              'Email Sent',
              'Password reset instructions have been sent to your email address. Please check your inbox and spam folder.'
            );
            
            // Auto-redirect to login page after 2 seconds with countdown
            this.startRedirectCountdown();
          } else {
            // Request processed but no email sent (unregistered email)
            this._notificationService.notification(
              'info',
              'Request Processed',
              'If an account with this email address exists, you will receive password reset instructions. Please check your email inbox and spam folder.'
            );
            
            // Auto-redirect to login page after 2 seconds for unregistered emails too
            this.startRedirectCountdown();
          }
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
    if (this.redirectTimer) {
      clearInterval(this.redirectTimer);
      this.redirectTimer = null;
    }
    this.redirectCountdown = 0;
    
    // Navigate with refresh
    this._routeRefreshService.navigateWithRefresh(['/accounts/login']);
  }

  goToRegister(): void {
    console.log('Navigating to register page...');
    this._routeRefreshService.navigateWithRefresh(['/accounts/register']);
  }

  goToHome(): void {
    console.log('Navigating to home page...');
    this._routeRefreshService.navigateWithRefresh(['/']);
  }

  refreshForgotPassword(): void {
    // Refresh the current forgot password page
    this._routeRefreshService.navigateWithRefresh(['/accounts/forgot-password']);
  }

  resendEmail(): void {
    this.emailSent = false;
    this.forgotPasswordForm.reset();
  }

  // Getter methods for form validation
  get email() { return this.forgotPasswordForm.get('email'); }

  private startRedirectCountdown(): void {
    this.redirectCountdown = 5;
    
    const countdownInterval = setInterval(() => {
      this.redirectCountdown--;
      
      if (this.redirectCountdown <= 0) {
        clearInterval(countdownInterval);
        this._routeRefreshService.navigateWithRefresh(['/accounts/login']);
      }
    }, 1000);
    
    // Store interval reference for cleanup
    this.redirectTimer = countdownInterval;
  }
} 