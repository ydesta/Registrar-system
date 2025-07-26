import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss']
})
export class VerifyEmailComponent implements OnInit {
  isLoading = false;
  verificationStatus: 'pending' | 'success' | 'error' = 'pending';
  errorMessage = '';
  userEmail = '';
  redirectCountdown = 0;

  constructor(
    private _notificationService: CustomNotificationService,
    private _router: Router,
    private _route: ActivatedRoute,
    private _authService: AuthService
  ) {}

  ngOnInit(): void {
    this._route.queryParams.subscribe(params => {
      let email = params['email'];
      let token = params['token'];
      if (email) {
        try {
          email = decodeURIComponent(email);
        } catch (e) {
        }
      }
      
      if (token) {
        try {
          token = decodeURIComponent(token);
        } catch (e) {
        }
      }
      
      this.userEmail = email;
      
      if (!email || !token) {
        this.verificationStatus = 'error';
        this.errorMessage = 'Invalid verification link. Please check your email for the correct link.';
        return;
      }

      this.verifyEmail(email, token);
    });
  }

  verifyEmail(email: string, token: string): void {
    this.isLoading = true;
    const url = `${environment.secureUrl}/authentication/verify-email?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
    this._authService.verifyEmailGet(email, token).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.verificationStatus = 'success';
        this._notificationService.notification(
          'success',
          'Email Verified',
          'Your email has been verified successfully. You can now login to your account.'
        );
        this.redirectCountdown = 3;
        const countdownInterval = setInterval(() => {
          this.redirectCountdown--;
          if (this.redirectCountdown <= 0) {
            clearInterval(countdownInterval);
            this._router.navigate(['/accounts/login']);
          }
        }, 1000);
      },
      error: (error) => {
        this.isLoading = false;
        this.verificationStatus = 'error';
        if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'An error occurred while verifying your email. Please try again or contact support.';
        }
        this._notificationService.notification('error', 'Verification Failed', this.errorMessage);
      }
    });
  }

  goToLogin(): void {
    this._router.navigate(['/accounts/login']);
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