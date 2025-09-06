import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, NavigationStart, NavigationEnd } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { environment } from 'src/environments/environment';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss']
})
export class VerifyEmailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  isLoading = false;
  verificationStatus: 'pending' | 'success' | 'error' = 'pending';
  errorMessage = '';
  userEmail = '';
  redirectCountdown = 0;
  private countdownIntervalId: any; // To store the interval ID

  constructor(
    private _notificationService: CustomNotificationService,
    private _router: Router,
    private _route: ActivatedRoute,
    private _authService: AuthService
  ) {}

  ngOnInit(): void {
    const paramsSubscription = this._route.queryParams.pipe(takeUntil(this.destroy$)).subscribe({
      next: (params) => {
        let email = params['email'];
        let token = params['token'];
        
        if (email) {
          try {
            email = decodeURIComponent(email);
          } catch (e) {
            // Error decoding email
          }
        }
        
        if (token) {
          try {
            token = decodeURIComponent(token);
          } catch (e) {
            // Error decoding token
          }
        }
        
        this.userEmail = email;
        
        if (!email || !token) {
          this.verificationStatus = 'error';
          this.errorMessage = 'Invalid verification link. Please check your email for the correct link.';
          return;
        }

        this.verifyEmail(email, token);
      },
      error: (error) => {
        // Error in route params subscription
      },
      complete: () => {
        // Route params subscription completed
      }
    });
    
    // Monitor route changes to see if navigation is working
    this._router.events.pipe(takeUntil(this.destroy$)).subscribe(event => {
      if (event instanceof NavigationStart) {
        // Navigation started
      } else if (event instanceof NavigationEnd) {
        // Navigation completed
      }
    });
  }

  ngOnDestroy(): void {
    // Clean up any running intervals
    if (this.countdownIntervalId) {
      clearInterval(this.countdownIntervalId);
      this.countdownIntervalId = null;
    }
    
    this.destroy$.next();
    this.destroy$.complete();
  }

  verifyEmail(email: string, token: string): void {
    this.isLoading = true;
    
    // Add error handling for the subscription
    const subscription = this._authService.verifyEmailGet(email, token).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.verificationStatus = 'success';
        
        // Check if the response indicates success
        if (response && (response.success === true || response.message)) {
          // Show notification but don't wait for it
          try {
            this._notificationService.notification(
              'success',
              'Email Verified',
              'Your email has been verified successfully. You can now login to your account.'
            );
          } catch (notificationError) {
            // Notification failed, but continuing with redirect
          }
          
          // Start countdown and redirect
          this.startRedirectCountdown();
        } else {
          // Still treat as success if we got here without error
          this.startRedirectCountdown();
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.verificationStatus = 'error';
        
        // Provide more specific error messages based on the error type
        if (error.status === 0) {
          this.errorMessage = 'Network error: Unable to connect to the server. Please check your internet connection and try again.';
        } else if (error.status === 400) {
          this.errorMessage = error.error?.message || 'Invalid verification link. The link may be expired or incorrect.';
        } else if (error.status === 401) {
          this.errorMessage = 'Authentication failed. Please try the verification link again.';
        } else if (error.status === 404) {
          this.errorMessage = 'Verification service not found. Please contact support.';
        } else if (error.status === 500) {
          this.errorMessage = 'Server error. Please try again later or contact support.';
        } else if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'An error occurred while verifying your email. Please try again or contact support.';
        }
        
        // Show notification but don't wait for it
        try {
          this._notificationService.notification('error', 'Verification Failed', this.errorMessage);
        } catch (notificationError) {
          // Error notification failed
        }
      },
      complete: () => {
        // Email verification subscription completed
      }
    });
  }

  private startRedirectCountdown(): void {
    // Clear any existing countdown
    if (this.countdownIntervalId) {
      clearInterval(this.countdownIntervalId);
      this.countdownIntervalId = null;
    }
    
    this.redirectCountdown = 2; // Reduced to 2 seconds for very fast navigation
    
    const countdownInterval = setInterval(() => {
      this.redirectCountdown--;
      
      if (this.redirectCountdown <= 0) {
        clearInterval(countdownInterval);
        this.countdownIntervalId = null;
        
        // Use setTimeout to ensure the navigation happens after the current component state is processed
        setTimeout(() => {
          this.navigateToLogin();
        }, 100);
      }
    }, 1000);
    
    // Store the interval ID so we can clear it if needed
    this.countdownIntervalId = countdownInterval;
  }

  private navigateToLogin(): void {
    if (this._router.url === '/accounts/login') {
      return;
    }
    
    // Check if component is still active
    if (this.destroy$.closed) {
      return;
    }
    
    // Navigate to login page and then refresh it
    try {
      // Method 1: Navigate to login page first
      window.location.href = '/accounts/login';
      
      // Method 2: After navigation, force a refresh to ensure proper loading
      setTimeout(() => {
        // Refresh the login page to ensure it loads completely
        window.location.reload();
      }, 500); // Wait 500ms for navigation to complete
      
    } catch (error) {
      // Fallback: Force navigation and refresh
      window.location.replace('/accounts/login');
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  }

  goToLogin(): void {
    this.navigateToLogin();
  }

  goToHome(): void {
    this._router.navigate(['/']);
  }

  manualVerify(): void {
    this._route.queryParams.subscribe(params => {
      const email = params['email'];
      const token = params['token'];
      if (email && token) {
        this.verifyEmail(email, token);
      } else {
        this._notificationService.notification(
          'error',
          'Error',
          'Email and token not found in URL. Please use the verification link from your email.'
        );
      }
    });
  }

  resendVerification(): void {
    if (!this.userEmail) {
      this._notificationService.notification(
        'error',
        'Error',
        'Email address not found. Please try the verification link again.'
      );
      return;
    }

    this.isLoading = true;
    this._authService.resendVerificationEmail(this.userEmail).subscribe({
      next: (response) => {
        this.isLoading = false;
        this._notificationService.notification(
          'success',
          'Verification Email Sent',
          'A new verification email has been sent to your email address. Please check your inbox.'
        );
      },
      error: (error) => {
        console.error('Resend verification failed:', error);
        this.isLoading = false;
        let errorMessage = 'Failed to resend verification email. Please try again.';
        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        }
        
        this._notificationService.notification('error', 'Resend Failed', errorMessage);
      }
    });
  }
} 