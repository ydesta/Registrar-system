import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginRequest } from 'src/app/services/auth.interface';
import { AuthService } from 'src/app/services/auth.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { SharedDataService } from 'src/app/services/shared-data.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  incorrectLoginAttempt = '';
  isLoading = false;
  requiresTwoFactor = false;
  emailForOtp = '';
  otpResendCountdown = 0;
  canResendOtp = true;

  constructor(
    private _notificationService: CustomNotificationService,
    private _router: Router,
    private _fb: FormBuilder,
    private _authService: AuthService,
    private _sharedDataService: SharedDataService
  ) {
    this.loginForm = _fb.group({
      email: [null, [Validators.required, Validators.email]],
      password: [null, [Validators.required]],
      rememberMe: [false],
    });
  }

  ngOnInit(): void {
    this._authService.isAuthenticated().then(isAuth => {
      if (isAuth) {
        this._router.navigate(['/dashboard']);
      }
    });
  }

  submitForm(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.incorrectLoginAttempt = '';

      const loginRequest: LoginRequest = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password,
        rememberMe: this.loginForm.value.rememberMe
      };
      this._authService.loginWithCredentials(loginRequest).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            if (response.requiresTwoFactor) {
              this.requiresTwoFactor = true;
              this.emailForOtp = loginRequest.email;
              this.startOtpResendCountdown();
              this._notificationService.notification(
                'info',
                'Two-Factor Authentication',
                'Please check your email for the verification code.'
              );
            } else {
              localStorage.setItem('isLogin', 'true');
              if (response.user) {
                localStorage.setItem('userId', response.user.id || '');
                localStorage.setItem('firstName', response.user.firstName || '');
                localStorage.setItem('lastName', response.user.lastName || '');
                localStorage.setItem('email', response.user.email || loginRequest.email);
                const userRoles = response.user.roles || [];
                localStorage.setItem('role', JSON.stringify(userRoles));
                localStorage.setItem('userType', userRoles[0] || '');
                localStorage.setItem('access_token', response.token || '');
                if (response.refreshToken) {
                  localStorage.setItem('refresh_token', response.refreshToken);
                }
              }
              this._sharedDataService.getLatestValue({
                type: 'LOGIN_SUCCESS',
                user: {
                  ...response.user,
                  role: Array.isArray(response.user.roles) ? response.user.roles[0] : (response.user.roles || '')
                }
              });
              this._notificationService.notification(
                'success',
                'Success',
                'Login successful!'
              );
              this.loginForm.reset();
              this._router.navigate(['/dashboard']);
            }
          } else {
            this.incorrectLoginAttempt = response.message;
            this._notificationService.notification('error', 'Error', response.message);
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.incorrectLoginAttempt = 'An error occurred during login. Please try again.';
          this._notificationService.notification('error', 'Error', 'An error occurred during login. Please try again.');
        }
      });
    } else {
      Object.values(this.loginForm.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  verifyOtp(otp: string): void {
    if (!otp || otp.length < 6) {
      this._notificationService.notification('error', 'Error', 'Please enter a valid 6-digit verification code.');
      return;
    }

    this.isLoading = true;
    this._authService.verifyOtp(this.emailForOtp, otp).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          localStorage.setItem('isLogin', 'true');
          if (response.user) {
            localStorage.setItem('userId', response.user.id || '');
            localStorage.setItem('firstName', response.user.firstName || '');
            localStorage.setItem('lastName', response.user.lastName || '');
            localStorage.setItem('email', response.user.email || this.emailForOtp);
            const userRoles = response.user.roles || [];
            localStorage.setItem('role', JSON.stringify(userRoles));
            localStorage.setItem('userType', userRoles[0] || '');
            localStorage.setItem('access_token', response.token || '');
            if (response.refreshToken) {
              localStorage.setItem('refresh_token', response.refreshToken);
            }
          }
          
          this._notificationService.notification(
            'success',
            'Success',
            'Login successful!'
          );
          this.requiresTwoFactor = false;
          this._sharedDataService.getLatestValue({
            type: 'LOGIN_SUCCESS',
            user: {
              ...response.user,
              role: Array.isArray(response.user.roles) ? response.user.roles[0] : (response.user.roles || '')
            }
          });
          this._router.navigate(['/dashboard']);
        } else {
          this._notificationService.notification('error', 'Error', response.message);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this._notificationService.notification('error', 'Error', 'Failed to verify OTP. Please try again.');
      }
    });
  }

  resendOtp(): void {
    if (!this.canResendOtp) {
      return;
    }

    this.isLoading = true;
    this._authService.resendOtp(this.emailForOtp).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.startOtpResendCountdown();
        this._notificationService.notification(
          'success',
          'Verification Code Sent',
          'A new verification code has been sent to your email address.'
        );
      },
      error: (error) => {
        this.isLoading = false;
        this._notificationService.notification('error', 'Error', 'Failed to resend verification code. Please try again.');
      }
    });
  }

  startOtpResendCountdown(): void {
    this.canResendOtp = false;
    this.otpResendCountdown = 60;
    
    const countdownInterval = setInterval(() => {
      this.otpResendCountdown--;
      if (this.otpResendCountdown <= 0) {
        this.canResendOtp = true;
        clearInterval(countdownInterval);
      }
    }, 1000);
  }

  forgotPassword(): void {
    const email = this.loginForm.get('email')?.value;
    if (!email) {
      this._notificationService.notification('error', 'Error', 'Please enter your email address first.');
      return;
    }

    this.isLoading = true;
    this._authService.forgotPassword(email).subscribe({
      next: (response) => {
        this.isLoading = false;
        this._notificationService.notification(
          'success',
          'Password Reset',
          'If an account with this email exists, you will receive password reset instructions.'
        );
      },
      error: (error) => {
        this.isLoading = false;
        this._notificationService.notification('error', 'Error', 'Failed to process password reset request.');
      }
    });
  }

  resendVerificationEmail(): void {
    const email = this.loginForm.get('email')?.value;
    if (!email) {
      this._notificationService.notification('error', 'Error', 'Please enter your email address first.');
      return;
    }

    this.isLoading = true;
    this._authService.resendVerificationEmail(email).subscribe({
      next: (response) => {
        this.isLoading = false;
        this._notificationService.notification(
          'success',
          'Verification Email Sent',
          'A new verification email has been sent to your email address. Please check your inbox and click the verification link.'
        );
      },
      error: (error) => {
        this.isLoading = false;
        this._notificationService.notification('error', 'Error', 'Failed to resend verification email. Please try again.');
      }
    });
  }

  goToRegister(): void {
    this._router.navigate(['/accounts/register']);
  }

  goToHome(): void {
    this._router.navigate(['/']);
  }
}
