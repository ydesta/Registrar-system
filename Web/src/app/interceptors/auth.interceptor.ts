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
import { SecureTokenStorageService } from '../services/secure-token-storage.service';
import { isApiUrl, isAuthUrl, isStaticResource } from '../constants';
import { SESSION_CONSTANTS } from '../services/session-management.constants';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isSessionExpired = false;
  private isHandlingExpiration = false;
  private static readonly SESSION_EXPIRATION_KEY = 'session_expiration_handled';

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: CustomNotificationService,
    private secureTokenStorage: SecureTokenStorageService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (isStaticResource(request.url) || !isApiUrl(request.url)) {
      return next.handle(request);
    }

    const authRequest = request.clone({ setHeaders: this.headers(request) });
    if (isAuthUrl(request.url) || this.isAuthPage()) {
      return next.handle(authRequest);
    }

    return next.handle(authRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        if (this.shouldExpireSession(error)) {
          this.handleSessionExpiration();
        }
        return throwError(() => error);
      })
    );
  }

  private headers(request: HttpRequest<unknown>): Record<string, string> {
    const headers: Record<string, string> = {
      'X-Client-App': environment.frontendClientKey
    };
    if (!isAuthUrl(request.url) && !this.isAuthPage()) {
      const token = this.bearerToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    if (environment.production && !(request.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      headers['Accept'] = 'application/json';
    }
    return headers;
  }

  private bearerToken(): string | null {
    const token = this.authService.getToken()?.trim().replace(/^Bearer\s+/i, '');
    if (!token) {
      return null;
    }
    return token.split('.').length === 3 && token.length > 50 ? token : null;
  }

  private isAuthPage(): boolean {
    const url = this.router.url;
    return url.includes('/accounts/login') || url.includes('/accounts/register');
  }

  private shouldExpireSession(error: HttpErrorResponse): boolean {
    if (this.isSessionExpired || this.isHandlingExpiration || this.isAuthPage()) {
      return false;
    }
    const isAuthError = error.status === 401 || error.status === 403
      || (error.status === 400 && this.isTokenError(error));
    if (!isAuthError) {
      return false;
    }
    const isLoggedIn = !!this.authService.getToken() || localStorage.getItem('isLogin') === 'true';
    if (!isLoggedIn) {
      return false;
    }
    return !sessionStorage.getItem(AuthInterceptor.SESSION_EXPIRATION_KEY);
  }

  private isTokenError(error: HttpErrorResponse): boolean {
    const message = error.error?.message || error.message || '';
    return /token|unauthorized|authentication/i.test(message);
  }

  private handleSessionExpiration(): void {
    if (this.isSessionExpired || this.isHandlingExpiration) {
      return;
    }
    this.isSessionExpired = true;
    this.isHandlingExpiration = true;
    sessionStorage.setItem(AuthInterceptor.SESSION_EXPIRATION_KEY, 'true');
    this.notificationService.notification(
      'warning',
      'Session Expired',
      'Your session has expired. Please log in again to continue.'
    );
    this.secureTokenStorage.clearTokens();
    SESSION_CONSTANTS.AUTH_KEYS.forEach(key => localStorage.removeItem(key));
    const currentUrl = this.router.url;
    if (!this.isAuthPage()) {
      setTimeout(() => {
        this.router.navigate(['/accounts/login'], {
          queryParams: {
            returnUrl: currentUrl !== '/' ? currentUrl : '/dashboard',
            reason: 'session_expired'
          },
          replaceUrl: true
        }).catch(() => {
          window.location.href = '/accounts/login';
        });
      }, 100);
    } else {
      this.isHandlingExpiration = false;
    }
    setTimeout(() => {
      this.isSessionExpired = false;
      this.isHandlingExpiration = false;
      sessionStorage.removeItem(AuthInterceptor.SESSION_EXPIRATION_KEY);
    }, 5000);
  }
}
