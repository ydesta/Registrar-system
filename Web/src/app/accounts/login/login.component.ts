import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { LoginRequest } from 'src/app/services/auth.interface';
import { AuthService } from 'src/app/services/auth.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { SharedDataService } from 'src/app/services/shared-data.service';
import { TokenStorageService } from 'src/app/services/token-storage.service';
import { environment } from 'src/environments/environment';
import { RouteRefreshService } from '../services/route-refresh.service';

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
    private _http: HttpClient
  ) {
    this.loginForm = _fb.group({
      email: [null, [Validators.required, Validators.email]],
      password: [null, [Validators.required]],
      rememberMe: [false],
    });
  }

  ngOnInit(): void {
    // Check for session expiration reason
    const reason = this._router.url.split('reason=')[1];
    if (reason && reason.includes('session_expired')) {
      this._notificationService.notification(
        'info',
        'Session Expired',
        'Your session has expired. Please log in again to continue.'
      );
    }

    // Check if already authenticated and redirect if necessary
    this._authService.isAuthenticated().then(isAuth => {
      if (isAuth) {
        const returnUrl = new URLSearchParams(window.location.search).get('returnUrl');
        const destination = returnUrl || '/dashboard';
        this._router.navigate([destination]);
      }
    });

    // Production-specific debugging
    if (environment.production) {
      
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
    }).catch(error => {
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


      this._authService.loginWithCredentials(loginRequest).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.isProcessingLogin = false;
          
          // Handle lockout status
          if (response.isLocked) {
            this.isAccountLocked = true;
            this.lockoutEndTime = response.lockoutEnd ? new Date(response.lockoutEnd) : null;
            this.remainingAttempts = 0;
          } else {
            this.isAccountLocked = false;
            this.lockoutEndTime = null;
            this.remainingAttempts = response.remainingAttempts ?? -1;
          }
          
          if (response.success) {
            if (response.requiresTwoFactor && !response.token) {
              this.requiresTwoFactor = true;
              this.emailForOtp = loginRequest.email;
              this.startOtpResendCountdown();
              this._notificationService.notification(
                'info',
                'Two-Factor Authentication',
                'Please check your email for the verification code.'
              );
              return; // Don't proceed with login handling
            }
            
            // Only handle successful login if tokens are provided
            if (response.token) {
              this.handleSuccessfulLogin(response, loginRequest.email);
            } else {
              console.error('Login response missing token:', response);
              this.incorrectLoginAttempt = 'Login failed. Please try again.';
            }
          } else {
            console.error('Login failed:', response.message);
            this.incorrectLoginAttempt = response.message;
            
            // Show appropriate notification based on lockout status
            if (response.isLocked) {
              this._notificationService.notification('warning', 'Account Locked', response.message);
            } else {
              this._notificationService.notification('error', 'Login Failed', response.message);
            }
          }
        },
        error: (error: any) => {
          console.error('Login error:', error);
          this.isLoading = false;
          this.isProcessingLogin = false;
          
          // Handle error response that might contain our custom error information
          let errorMessage = 'Invalid email or password. Please check your credentials and try again.';
          
          // Get the original error or error from the custom error wrapper
          const originalError = error.originalError || error;
          const errorData = error.error || originalError.error || error;
          
          // Check if this is a 401 error with LoginResponse details
          if ((error.status === 401 || originalError.status === 401) && errorData) {
            // The backend returns LoginResponse even for failed logins
            const loginResponse = errorData;
            
            if (loginResponse.message) {
              errorMessage = loginResponse.message;
            }
            
            // Extract remaining attempts and lockout info if available
            if (loginResponse.remainingAttempts !== undefined) {
              this.remainingAttempts = loginResponse.remainingAttempts;
              console.log('Remaining attempts:', this.remainingAttempts);
            }
            
            if (loginResponse.isLocked) {
              this.isAccountLocked = true;
              if (loginResponse.lockoutEnd) {
                this.lockoutEndTime = new Date(loginResponse.lockoutEnd);
              }
              this._notificationService.notification('warning', 'Account Locked', errorMessage);
            } else {
              this._notificationService.notification('error', 'Login Failed', errorMessage);
            }
          } else if (error.message) {
            if (error.message.includes('Network error')) {
              errorMessage = 'Network error: Unable to connect to the server. Please check your internet connection and try again.';
            } else if (error.message.includes('timeout')) {
              errorMessage = 'Request timeout: The server is taking too long to respond. Please try again.';
            } else if (error.message.includes('Authentication failed')) {
              errorMessage = 'Invalid email or password. Please check your credentials and try again.';
            }
            this._notificationService.notification('error', 'Error', errorMessage);
          }
          
          this.incorrectLoginAttempt = errorMessage;
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
    // ✅ FIX: Don't save user data if 2FA is pending (no tokens yet)
    if (response.requiresTwoFactor && !response.token) {
      console.log('2FA pending - skipping user data save');
      return;
    }
    
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
    this._routeRefreshService.navigateWithRefresh(['/accounts/register']);
  }

  goToForgotPassword(): void {
    this._routeRefreshService.navigateWithRefresh(['/accounts/forgot-password']);
  }

  goToHome(): void {
    this._routeRefreshService.navigateWithRefresh(['/']);
  }
}
