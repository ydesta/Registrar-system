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
import { Observable, catchError, from, throwError } from 'rxjs';
import { Constants } from '../constants';

@Injectable({
  providedIn: 'root',
})
export class AuthInterceptorService implements HttpInterceptor {
  constructor(private _authService: AuthService, private _router: Router) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Only intercept API requests
    if (req.url.startsWith(Constants.apiRoot)) {
      return from(
        this._authService.getAccessToken().then((token) => {
          const headers = new HttpHeaders().set(
            'Authorization',
            `Bearer ${token}`
          );
          const authRequest = req.clone({ headers });
          
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
              
              console.error('AuthInterceptorService Error:', errorDetails);

              if (err && (err.status === 401 || err.status === 403)) {
                console.log('Unauthorized/Forbidden - redirecting to unauthorized page');
                this._router.navigate(['/unauthorized']);
              } else if (err?.status === 0) {
                console.error('Network error detected - possible CORS or SSL issue');
                console.error('This could be due to:');
                console.error('- CORS policy blocking the request');
                console.error('- SSL certificate issues');
                console.error('- Network connectivity problems');
                console.error('- Server not running or not accessible');
              } else if (err?.status >= 500) {
                console.error('Server error detected');
              }
              
              return throwError(() => err);
            })
          ).toPromise();
        })
      );
    } else {
      // Not an API request, proceed normally
      return next.handle(req);
    }
  }
}
