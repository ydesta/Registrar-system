import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpHeaders,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, catchError, from, throwError, switchMap } from 'rxjs';
import { Constants } from '../constants';
import { environment } from '../../environments/environment';
import { SecureLoggerService } from './secure-logger.service';

@Injectable({
  providedIn: 'root',
})
export class AuthInterceptorService implements HttpInterceptor {
  constructor(
    private _authService: AuthService,
    private _router: Router,
    private _logger: SecureLoggerService
  ) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Only intercept API requests
    if (req.url.startsWith(Constants.apiRoot)) {
      this._logger.debug('AuthInterceptorService: Intercepting API request to:', req.url);
      
      // Skip adding token for authentication endpoints (login, register, etc.)
      const isAuthEndpoint = req.url.includes('/authentication/login') || 
                             req.url.includes('/authentication/register') ||
                             req.url.includes('/authentication/test-login') ||
                             req.url.includes('/authentication/database-check');
      
      if (isAuthEndpoint) {
        this._logger.debug('AuthInterceptorService: Skipping token for auth endpoint:', req.url);
        return next.handle(req);
      }
      
      // Use switchMap to properly handle the async token retrieval
      return from(this._authService.getAccessToken()).pipe(
        switchMap((token: string) => {
          this._logger.debug('AuthInterceptorService: Token received:', token ? 'Token exists' : 'No token');
          
          // If no token, proceed with original request
          if (!token) {
            return next.handle(req);
          }
          
          // Clone the request with the token and custom client header
          const headers = new HttpHeaders()
            .set('Authorization', `Bearer ${token}`)
            .set('X-Client-App', environment.frontendClientKey); // Required header to identify frontend requests
          const authRequest = req.clone({ headers });
          this._logger.debug('AuthInterceptorService: Making authenticated request to:', authRequest.url);
          
          return next.handle(authRequest).pipe(
            catchError((err: HttpErrorResponse) => {
              // Safely access error properties with fallbacks
              const errorDetails = {
                status: err?.status || 'unknown',
                statusText: err?.statusText || 'unknown',
                url: err?.url || req.url,
                error: err?.error || 'unknown error',
                message: err?.message || 'unknown message'
              };
              
              this._logger.error('AuthInterceptorService Error:', errorDetails);

              if (err && (err.status === 401 || err.status === 403)) {
                this._logger.debug('Unauthorized/Forbidden - redirecting to unauthorized page');
                this._logger.debug('Error details:', {
                  status: err.status,
                  url: err.url,
                  userRole: localStorage.getItem('role'),
                  userType: localStorage.getItem('userType'),
                  isLogin: localStorage.getItem('isLogin')
                });
                
                // Don't redirect for UserManagement credentials endpoint - let component handle it
                if (err.url && err.url.includes('/UserManagement/credentials')) {
                  this._logger.debug('Skipping redirect for UserManagement credentials endpoint');
                  return throwError(() => err);
                }
                
                this._router.navigate(['/unauthorized']);
              } else if (err?.status === 0) {
                this._logger.error('Network error detected - possible CORS or SSL issue');
                this._logger.debug('This could be due to:');
                this._logger.debug('- CORS policy blocking the request');
                this._logger.debug('- SSL certificate issues');
                this._logger.debug('- Network connectivity problems');
                this._logger.debug('- Server not running or not accessible');
              } else if (err?.status >= 500) {
                this._logger.error('Server error detected');
              }
              
              return throwError(() => err);
            })
          );
        })
      );
    } else {
      // Not an API request, proceed normally
      return next.handle(req);
    }
  }
}
