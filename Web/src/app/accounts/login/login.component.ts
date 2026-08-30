import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginRequest } from 'src/app/services/auth.interface';
import { AuthService } from 'src/app/services/auth.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { SharedDataService } from 'src/app/services/shared-data.service';
import { TokenStorageService } from 'src/app/services/token-storage.service';
import { RouteRefreshService } from '../services/route-refresh.service';
import { SecureLoggerService } from 'src/app/services/secure-logger.service';

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
  private isProcessingLogin = false;
  isAccountLocked = false;
  lockoutEndTime: Date | null = null;
  remainingAttempts = -1;

  constructor(
    private _notificationService: CustomNotificationService,
    private _router: Router,
    private _fb: FormBuilder,
    private _authService: AuthService,
    private _sharedDataService: SharedDataService,
    private _tokenStorageService: TokenStorageService,
    private _routeRefreshService: RouteRefreshService,
    private _logger: SecureLoggerService
  ) {
    this.loginForm = _fb.group({
      email: [null, [Validators.required, Validators.email]],
      password: [null, [Validators.required]],
      rememberMe: [false],
    });
  }

  ngOnInit(): void {
    const reason = new URLSearchParams(window.location.search).get('reason');
    if (reason?.includes('session_expired')) {
      this._notificationService.notification(
        'info',
        'Session Expired',
        'Your session has expired. Please log in again to continue.'
      );
    }

    this._authService.isAuthenticated().then(isAuth => {
      if (isAuth) {
        const returnUrl = new URLSearchParams(window.location.search).get('returnUrl');
        this._router.navigate([returnUrl || '/dashboard']);
      }
    });
  }

  submitForm(): void {
    if (!this.loginForm.valid) {
      this.markInvalid(this.loginForm);
      return;
    }
    if (this.isProcessingLogin) {
      return;
    }

    this.isProcessingLogin = true;
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
        this.isProcessingLogin = false;
        this.applyLockout(response);

        if (!response.success) {
          this.incorrectLoginAttempt = response.message;
          this._notificationService.notification(
            response.isLocked ? 'warning' : 'error',
            response.isLocked ? 'Account Locked' : 'Login Failed',
            response.message
          );
          return;
        }

        if (response.requiresTwoFactor && !response.token) {
          this.requiresTwoFactor = true;
          this.emailForOtp = loginRequest.email;
          this.startOtpResendCountdown();
          this._notificationService.notification(
            'info',
            'Two-Factor Authentication',
            'Please check your email for the verification code.'
          );
          return;
        }

        if (response.token) {
          this.handleSuccessfulLogin(response, loginRequest.email);
          return;
        }

        this._logger.error('Login response missing token');
        this.incorrectLoginAttempt = 'Login failed. Please try again.';
      },
      error: (error: any) => {
        this.isLoading = false;
        this.isProcessingLogin = false;
        const errorMessage = this.loginErrorMessage(error);
        this.incorrectLoginAttempt = errorMessage;
      }
    });
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
          this.handleSuccessfulLogin(response, this.emailForOtp);
          this.requiresTwoFactor = false;
          return;
        }
        this._notificationService.notification('error', 'Error', response.message);
      },
      error: () => {
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
      next: () => {
        this.isLoading = false;
        this.startOtpResendCountdown();
        this._notificationService.notification(
          'success',
          'Verification Code Sent',
          'A new verification code has been sent to your email address.'
        );
      },
      error: () => {
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
      next: () => {
        this.isLoading = false;
        this._notificationService.notification(
          'success',
          'Password Reset',
          'If an account with this email exists, you will receive password reset instructions.'
        );
      },
      error: () => {
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
      next: () => {
        this.isLoading = false;
        this._notificationService.notification(
          'success',
          'Verification Email Sent',
          'A new verification email has been sent to your email address. Please check your inbox and click the verification link.'
        );
      },
      error: () => {
        this.isLoading = false;
        this._notificationService.notification('error', 'Error', 'Failed to resend verification email. Please try again.');
      }
    });
  }

  goToRegister(): void {
    this._routeRefreshService.navigateWithRefresh(['/accounts/register']);
  }

  goToForgotPassword(): void {
    this._routeRefreshService.navigateWithRefresh(['/accounts/forgot-password']);
  }

  goToHome(): void {
    this._routeRefreshService.navigateWithRefresh(['/']);
  }

  private handleSuccessfulLogin(response: any, email: string): void {
    try {
      this.saveUserData(response, email);
      this._sharedDataService.getLatestValue({
        type: 'LOGIN_SUCCESS',
        user: {
          ...response.user,
          role: Array.isArray(response.user.roles) ? response.user.roles[0] : (response.user.roles || '')
        }
      });
      this._notificationService.notification('success', 'Success', 'Login successful!');
      this.loginForm.reset();
      setTimeout(() => {
        this._router.navigate(['/dashboard']).then(() => {
          window.location.reload();
        }).catch(() => {
          window.location.href = '/dashboard';
        });
      }, 100);
    } catch {
      this._notificationService.notification('error', 'Error', 'Failed to complete login process.');
    }
  }

  private saveUserData(response: any, email: string): void {
    if (response.requiresTwoFactor && !response.token) {
      return;
    }
    if (!response.user?.id) {
      return;
    }
    this._tokenStorageService.saveUser(response.user);
    this._tokenStorageService.isLogin('true', response.user.id);
    if (response.token) {
      localStorage.setItem('access_token', response.token);
      this._authService.setAccessToken(response.token);
      this._tokenStorageService.saveToken(response.token, response.user.id);
    }
    if (response.refreshToken) {
      localStorage.setItem('refresh_token', response.refreshToken);
      this._authService.setRefreshToken(response.refreshToken);
    }
    const userRoles = response.user.roles || [];
    localStorage.setItem('isLogin', 'true');
    localStorage.setItem('userId', response.user.id || '');
    localStorage.setItem('firstName', response.user.firstName || '');
    localStorage.setItem('lastName', response.user.lastName || '');
    localStorage.setItem('email', response.user.email || email);
    localStorage.setItem('role', JSON.stringify(userRoles));
    localStorage.setItem('userType', userRoles[0] || '');
    this._authService.updateCurrentUser(response.user);
    this._authService.updateLoginState(true);
  }

  private applyLockout(response: any): void {
    if (response.isLocked) {
      this.isAccountLocked = true;
      this.lockoutEndTime = response.lockoutEnd ? new Date(response.lockoutEnd) : null;
      this.remainingAttempts = 0;
      return;
    }
    this.isAccountLocked = false;
    this.lockoutEndTime = null;
    this.remainingAttempts = response.remainingAttempts ?? -1;
  }

  private loginErrorMessage(error: any): string {
    const originalError = error.originalError || error;
    const errorData = error.error || originalError.error || error;
    if ((error.status === 401 || originalError.status === 401) && errorData) {
      const errorMessage = errorData.message || 'Invalid email or password. Please check your credentials and try again.';
      if (errorData.remainingAttempts !== undefined) {
        this.remainingAttempts = errorData.remainingAttempts;
      }
      this.applyLockout(errorData);
      this._notificationService.notification(
        errorData.isLocked ? 'warning' : 'error',
        errorData.isLocked ? 'Account Locked' : 'Login Failed',
        errorMessage
      );
      return errorMessage;
    }
    let errorMessage = 'Invalid email or password. Please check your credentials and try again.';
    if (error.message?.includes('Network error')) {
      errorMessage = 'Network error: Unable to connect to the server. Please check your internet connection and try again.';
    } else if (error.message?.includes('timeout')) {
      errorMessage = 'Request timeout: The server is taking too long to respond. Please try again.';
    }
    this._notificationService.notification('error', 'Error', errorMessage);
    return errorMessage;
  }

  private markInvalid(form: FormGroup): void {
    Object.values(form.controls).forEach(control => {
      if (control.invalid) {
        control.markAsDirty();
        control.updateValueAndValidity({ onlySelf: true });
      }
    });
  }
}
