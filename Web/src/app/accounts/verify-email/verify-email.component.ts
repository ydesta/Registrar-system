import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
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
  private countdownIntervalId: any;

  constructor(
    private _notificationService: CustomNotificationService,
    private _router: Router,
    private _route: ActivatedRoute,
    private _authService: AuthService
  ) {}

  ngOnInit(): void {
    this._route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const email = this.decode(params['email']);
      const token = this.decode(params['token']);
      this.userEmail = email;
      if (!email || !token) {
        this.verificationStatus = 'error';
        this.errorMessage = 'Invalid verification link. Please check your email for the correct link.';
        return;
      }
      this.verifyEmail(email, token);
    });
  }

  ngOnDestroy(): void {
    if (this.countdownIntervalId) {
      clearInterval(this.countdownIntervalId);
      this.countdownIntervalId = null;
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  verifyEmail(email: string, token: string): void {
    this.isLoading = true;
    this._authService.verifyEmailGet(email, token).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isLoading = false;
        this.verificationStatus = 'success';
        this._notificationService.notification(
          'success',
          'Email Verified',
          'Your email has been verified successfully. You can now login to your account.'
        );
        this.startRedirectCountdown();
      },
      error: (error) => {
        this.isLoading = false;
        this.verificationStatus = 'error';
        this.errorMessage = this.verificationError(error);
        this._notificationService.notification('error', 'Verification Failed', this.errorMessage);
      }
    });
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
        return;
      }
      this._notificationService.notification(
        'error',
        'Error',
        'Email and token not found in URL. Please use the verification link from your email.'
      );
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
      next: () => {
        this.isLoading = false;
        this._notificationService.notification(
          'success',
          'Verification Email Sent',
          'A new verification email has been sent to your email address. Please check your inbox.'
        );
      },
      error: (error) => {
        this.isLoading = false;
        this._notificationService.notification(
          'error',
          'Resend Failed',
          error.error?.message || 'Failed to resend verification email. Please try again.'
        );
      }
    });
  }

  private startRedirectCountdown(): void {
    if (this.countdownIntervalId) {
      clearInterval(this.countdownIntervalId);
    }
    this.redirectCountdown = 2;
    this.countdownIntervalId = setInterval(() => {
      this.redirectCountdown--;
      if (this.redirectCountdown <= 0) {
        clearInterval(this.countdownIntervalId);
        this.countdownIntervalId = null;
        this.navigateToLogin();
      }
    }, 1000);
  }

  private navigateToLogin(): void {
    if (this._router.url === '/accounts/login' || this.destroy$.closed) {
      return;
    }
    window.location.href = '/accounts/login';
  }

  private decode(value?: string): string {
    if (!value) {
      return '';
    }
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  private verificationError(error: any): string {
    if (error.status === 0) {
      return 'Network error: Unable to connect to the server. Please check your internet connection and try again.';
    }
    if (error.status === 400) {
      return error.error?.message || 'Invalid verification link. The link may be expired or incorrect.';
    }
    if (error.status === 401) {
      return 'Authentication failed. Please try the verification link again.';
    }
    if (error.status === 404) {
      return 'Verification service not found. Please contact support.';
    }
    if (error.status === 500) {
      return 'Server error. Please try again later or contact support.';
    }
    return error.error?.message || 'An error occurred while verifying your email. Please try again or contact support.';
  }
}
