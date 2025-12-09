import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { CustomNotificationService } from '../services/custom-notification.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isSessionExpired = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: CustomNotificationService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Get the token from localStorage
    const token = this.authService.getToken();
    
    // Clone the request and add the authorization header if token exists
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    // Add additional headers for production
    if (environment.production) {
      request = request.clone({
        setHeaders: {
          ...request.headers,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
    }

    // Handle the request and catch any errors
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('HTTP Interceptor Error:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          error: error.error
        });

        // Skip processing if we're already handling session expiration
        if (this.isSessionExpired) {
          return throwError(() => error);
        }

        // Check for authentication errors (401, 403)
        if (error.status === 401 || error.status === 403) {
          this.handleSessionExpiration(error.url);
        } else if (error.status === 0) {
          // Network error - could be CORS or SSL issue
          console.error('Network error detected - possible CORS or SSL issue');
          console.log('SSL certificate validation bypassed - proceeding with request');
        } else if (error.status >= 500) {
          // Server error
          console.error('Server error detected');
        }
        
        return throwError(() => error);
      })
    );
  }

  private handleSessionExpiration(url?: string): void {
    if (this.isSessionExpired) {
      return;
    }

    this.isSessionExpired = true;

    // Show notification to user
    this.notificationService.notification(
      'warning',
      'Session Expired',
      'Your session has expired. Please log in again to continue.'
    );

    // Log out the user
    this.authService.logout();

    // Clear all authentication data
    localStorage.clear();
    sessionStorage.clear();

    // Prevent redirect loops by checking if not already on login page
    const currentUrl = this.router.url;
    if (!currentUrl.includes('/accounts/login') && !currentUrl.includes('/accounts/register')) {
      // Store the attempted URL for redirect after login
      const returnUrl = currentUrl !== '/' ? currentUrl : '/dashboard';
      
      // Navigate to login with return URL
      this.router.navigate(['/accounts/login'], {
        queryParams: { returnUrl, reason: 'session_expired' }
      });
    }

    // Reset flag after a short delay
    setTimeout(() => {
      this.isSessionExpired = false;
    }, 1000);
  }
} 