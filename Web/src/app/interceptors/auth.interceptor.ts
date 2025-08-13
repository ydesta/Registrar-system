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

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthService,
    private router: Router
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

        if (error.status === 401) {
          // Token is invalid or expired
          console.log('401 Unauthorized - logging out user');
          this.authService.logout();
          this.router.navigate(['/accounts/login']);
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
} 