import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { LoginRequest } from 'src/app/services/auth.interface';
import { AuthService } from 'src/app/services/auth.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { SharedDataService } from 'src/app/services/shared-data.service';
import { TokenStorageService } from 'src/app/services/token-storage.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  loginForm: FormGroup;
  incorrectLoginAttempt = '';
  isLoading = false;
  requiresTwoFactor = false;
  emailForOtp = '';
  otpResendCountdown = 0;
  canResendOtp = true;
  private isProcessingLogin = false;

  constructor(
    private _notificationService: CustomNotificationService,
    private _router: Router,
    private _fb: FormBuilder,
    private _authService: AuthService,
    private _sharedDataService: SharedDataService,
    private _tokenStorageService: TokenStorageService
  ) {
    this.loginForm = _fb.group({
      email: [null, [Validators.required, Validators.email]],
      password: [null, [Validators.required]],
      rememberMe: [false],
    });
  }

  ngOnInit(): void {
    // Check if already authenticated and redirect if necessary
    this._authService.isAuthenticated().then(isAuth => {
      if (isAuth) {
        this._router.navigate(['/dashboard']);
      }
    });

    // Production-specific debugging
    if (environment.production) {
      console.log('Production Environment Detected');
      console.log('API Base URL:', environment.secureUrl);
      
      // Test network connectivity
      this.testNetworkConnectivity();
    }
  }

  private testNetworkConnectivity(): void {
    // Test if the API endpoint is reachable
    fetch(`${environment.secureUrl}/health`, { 
      method: 'GET',
      mode: 'cors'
    }).then(response => {
      console.log('Network connectivity test successful:', response.status);
    }).catch(error => {
      console.error('Network connectivity test failed:', error);
      console.error('This might indicate a CORS, SSL, or network issue in production');
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  submitForm(): void {
    if (this.loginForm.valid && !this.isProcessingLogin) {
      this.isProcessingLogin = true;
      this.isLoading = true;
      this.incorrectLoginAttempt = '';

      const loginRequest: LoginRequest = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password,
        rememberMe: this.loginForm.value.rememberMe
      };

      console.log('Attempting login with:', { email: loginRequest.email, rememberMe: loginRequest.rememberMe });

      this._authService.loginWithCredentials(loginRequest).subscribe({
        next: (response) => {
          console.log('Login response received:', response);
          this.isLoading = false;
          this.isProcessingLogin = false;
          
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
              this.handleSuccessfulLogin(response, loginRequest.email);
            }
          } else {
            console.error('Login failed:', response.message);
            this.incorrectLoginAttempt = response.message;
            this._notificationService.notification('error', 'Error', response.message);
          }
        },
        error: (error) => {
          console.error('Login error:', error);
          this.isLoading = false;
          this.isProcessingLogin = false;
          
          // Production-specific error handling
          let errorMessage = 'An error occurred during login. Please try again.';
          
          if (error.message) {
            if (error.message.includes('Network error')) {
              errorMessage = 'Network error: Unable to connect to the server. Please check your internet connection and try again.';
            } else if (error.message.includes('timeout')) {
              errorMessage = 'Request timeout: The server is taking too long to respond. Please try again.';
            } else if (error.message.includes('Authentication failed')) {
              errorMessage = 'Invalid email or password. Please check your credentials and try again.';
            } else {
              errorMessage = error.message;
            }
          }
          
          this.incorrectLoginAttempt = errorMessage;
          this._notificationService.notification('error', 'Error', errorMessage);
        }
      });
    } else if (this.isProcessingLogin) {
      // Prevent multiple login attempts
      console.log('Login already in progress, ignoring duplicate request');
      return;
    } else {
      console.log('Form validation failed');
      Object.values(this.loginForm.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  private handleSuccessfulLogin(response: any, email: string): void {
    try {
      console.log('Processing successful login:', response);
      
      // Save user data first
      this.saveUserData(response, email);
      
      // Update shared data service
      this._sharedDataService.getLatestValue({
        type: 'LOGIN_SUCCESS',
        user: {
          ...response.user,
          role: Array.isArray(response.user.roles) ? response.user.roles[0] : (response.user.roles || '')
        }
      });

      // Show success notification
      this._notificationService.notification(
        'success',
        'Success',
        'Login successful!'
      );

      // Reset form
      this.loginForm.reset();

      // Use setTimeout to ensure state is properly set before navigation
      setTimeout(() => {
        console.log('Navigating to dashboard...');
        this._router.navigate(['/dashboard']).then(() => {
          console.log('Navigation successful, reloading page...');
          // Force a page reload to ensure all components are properly initialized
          window.location.reload();
        }).catch((error) => {
          console.error('Navigation failed:', error);
          // Fallback navigation
          window.location.href = '/dashboard';
        });
      }, 100);

    } catch (error) {
      console.error('Error during login processing:', error);
      this._notificationService.notification('error', 'Error', 'Failed to complete login process.');
    }
  }

  private saveUserData(response: any, email: string): void {
    if (response.user && response.user.id) {
      // Save user data using token storage service
      this._tokenStorageService.saveUser(response.user);
      this._tokenStorageService.isLogin('true', response.user.id);
      
      // Save tokens
      if (response.token) {
        this._tokenStorageService.saveToken(response.token, response.user.id);
      }
      
      // Also save to localStorage for backward compatibility
      localStorage.setItem('isLogin', 'true');
      localStorage.setItem('userId', response.user.id || '');
      localStorage.setItem('firstName', response.user.firstName || '');
      localStorage.setItem('lastName', response.user.lastName || '');
      localStorage.setItem('email', response.user.email || email);
      const userRoles = response.user.roles || [];
      localStorage.setItem('role', JSON.stringify(userRoles));
      localStorage.setItem('userType', userRoles[0] || '');
      localStorage.setItem('access_token', response.token || '');
      if (response.refreshToken) {
        localStorage.setItem('refresh_token', response.refreshToken);
      }

      // Ensure authentication state is properly set
      this._authService.updateCurrentUser(response.user);
      this._authService.updateLoginState(true);
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
          this.handleSuccessfulLogin(response, this.emailForOtp);
          this.requiresTwoFactor = false;
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
