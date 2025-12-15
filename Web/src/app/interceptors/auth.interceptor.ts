import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
  HttpHeaders
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { CustomNotificationService } from '../services/custom-notification.service';
import { Constants } from '../constants';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isSessionExpired = false;
  private isHandlingExpiration = false;
  private static readonly SESSION_EXPIRATION_KEY = 'session_expiration_handled';

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: CustomNotificationService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Check if this is an API request (SecureAuth or College Registration System)
    const isSecureAuthApi = request.url.startsWith(Constants.apiRoot) || 
                           request.url.startsWith(environment.secureUrl);
    const isCollegeApi = request.url.startsWith(environment.baseUrl);
    const isApiRequest = isSecureAuthApi || isCollegeApi;

    // Only intercept API requests
    if (!isApiRequest) {
      return next.handle(request);
    }

    // Skip adding token for authentication endpoints
    const isAuthEndpoint = request.url.includes('/authentication/login') || 
                           request.url.includes('/usr/login') ||
                           request.url.includes('/authentication/register') ||
                           request.url.includes('/authentication/test-login') ||
                           request.url.includes('/authentication/database-check') ||
                           request.url.includes('/authentication/verify-otp') ||
                           request.url.includes('/authentication/forgot-password') ||
                           request.url.includes('/authentication/reset-password') ||
                           request.url.includes('/authentication/verify-email') ||
                           request.url.includes('/authentication/resend-verification-email') ||
                           request.url.includes('/authentication/resend-otp') ||
                           request.url.includes('/authentication/csrf-token');

    if (isAuthEndpoint) {
      // Still add X-Client-App header for auth endpoints (required by backend middleware)
      const authRequest = request.clone({
        setHeaders: {
          'X-Client-App': environment.frontendClientKey
        }
      });
      return next.handle(authRequest);
    }

    // Skip if we're already on login/register page to prevent loops
    // But still add X-Client-App header as it's required for all API requests
    const currentUrl = this.router.url;
    if (currentUrl.includes('/accounts/login') || currentUrl.includes('/accounts/register')) {
      const requestWithHeader = request.clone({
        setHeaders: {
          'X-Client-App': environment.frontendClientKey
        }
      });
      return next.handle(requestWithHeader);
    }

    // Get the token from AuthService
    const token = this.authService.getToken();
    
    // Clone the request and add the authorization header if token exists
    let authRequest = request;
    if (token && token.trim().length > 0) {
      // Clean the token - remove any whitespace and ensure it doesn't already have "Bearer " prefix
      const cleanToken = token.trim().replace(/^Bearer\s+/i, '');
      
      // Validate token format (JWT tokens should have 3 parts separated by dots)
      const tokenParts = cleanToken.split('.');
      const isValidJwtFormat = tokenParts.length === 3 && cleanToken.length > 50;
      
      if (!isValidJwtFormat) {
        // Don't add invalid token to request
      } else {
        // Clone request with Authorization header
        authRequest = request.clone({
          setHeaders: {
            Authorization: `Bearer ${cleanToken}`
          }
        });
      }
    }

    // Add custom client header to identify requests from Angular frontend
    // This header is required by the backend to block testing tools
    authRequest = authRequest.clone({
      setHeaders: {
        'X-Client-App': environment.frontendClientKey,
        ...(environment.production ? {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        } : {})
      }
    });

    // Handle the request and catch any errors
    return next.handle(authRequest).pipe(
      catchError((error: HttpErrorResponse) => {

        // Skip 401/403 handling if we're already handling expiration or on auth endpoints
        if (this.isSessionExpired || this.isHandlingExpiration) {
          return throwError(() => error);
        }

        // Skip 401/403 for authentication endpoints (they might return 401 for invalid credentials)
        if (isAuthEndpoint && (error.status === 401 || error.status === 403)) {
          return throwError(() => error);
        }

        // Check for authentication errors (401, 403) - but only for non-auth endpoints
        if (error.status === 401 || error.status === 403) {
          // Check if user is actually logged in (has token) - if not, it's just "not authenticated", not "session expired"
          const hasToken = this.authService.getToken();
          const isLoggedIn = localStorage.getItem('isLogin') === 'true';
          
          // Only handle as session expiration if user was previously logged in
          // If no token and not logged in, it's just an unauthenticated request - don't trigger session expiration
          if (hasToken || isLoggedIn) {
            // Check if we're already on login page - if so, don't handle again
            if (!currentUrl.includes('/accounts/login') && !currentUrl.includes('/accounts/register')) {
              // Use sessionStorage to prevent multiple handlers from running simultaneously
              const expirationHandled = sessionStorage.getItem(AuthInterceptor.SESSION_EXPIRATION_KEY);
              if (!expirationHandled) {
                this.handleSessionExpiration(error.url);
              }
            }
          }
          // If no token and not logged in, just let the error pass through - it's expected behavior
        } else if (error.status === 400) {
          // 400 Bad Request - might be token validation issue
          const errorMessage = error.error?.message || error.message;
          if (errorMessage && (errorMessage.includes('token') || errorMessage.includes('Unauthorized') || errorMessage.includes('Authentication'))) {
            // Treat as authentication error
            const hasToken = this.authService.getToken();
            const isLoggedIn = localStorage.getItem('isLogin') === 'true';
            if (hasToken || isLoggedIn) {
              if (!currentUrl.includes('/accounts/login') && !currentUrl.includes('/accounts/register')) {
                const expirationHandled = sessionStorage.getItem(AuthInterceptor.SESSION_EXPIRATION_KEY);
                if (!expirationHandled) {
                  this.handleSessionExpiration(error.url);
                }
              }
            }
          }
        }
        
        return throwError(() => error);
      })
    );
  }

  private handleSessionExpiration(url?: string): void {
    // Prevent multiple simultaneous calls
    if (this.isSessionExpired || this.isHandlingExpiration) {
      return;
    }

    // Set flags immediately to prevent concurrent execution
    this.isSessionExpired = true;
    this.isHandlingExpiration = true;
    sessionStorage.setItem(AuthInterceptor.SESSION_EXPIRATION_KEY, 'true');

    // Show notification to user (only once)
    this.notificationService.notification(
      'warning',
      'Session Expired',
      'Your session has expired. Please log in again to continue.'
    );

    // Clear authentication data
    localStorage.removeItem('isLogin');
    localStorage.removeItem('userId');
    localStorage.removeItem('firstName');
    localStorage.removeItem('lastName');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
    localStorage.removeItem('userType');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('currentUserId');

    // Check current URL before navigating
    const currentUrl = this.router.url;
    
    // Only navigate if not already on login/register page
    if (!currentUrl.includes('/accounts/login') && !currentUrl.includes('/accounts/register')) {
      // Use a small delay to ensure state is set
      setTimeout(() => {
        // Use router navigation instead of window.location to prevent full page reload
        this.router.navigate(['/accounts/login'], {
          queryParams: { 
            returnUrl: currentUrl !== '/' ? currentUrl : '/dashboard',
            reason: 'session_expired' 
          },
          replaceUrl: true // Replace current history entry to prevent back button issues
        }).catch(() => {
          // Fallback to window.location only if router navigation fails
          window.location.href = '/accounts/login';
        });
      }, 100);
    } else {
      // Already on login page, just clear the flag
      this.isHandlingExpiration = false;
    }

    // Reset flags after a longer delay to prevent rapid re-triggering
    setTimeout(() => {
      this.isSessionExpired = false;
      this.isHandlingExpiration = false;
      sessionStorage.removeItem(AuthInterceptor.SESSION_EXPIRATION_KEY);
    }, 5000); // Increased from 1000ms to 5000ms
  }
} 