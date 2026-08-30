import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { SecureLoggerService } from './secure-logger.service';
import { isApiUrl, isAuthUrl, isStaticResource } from '../constants';

@Injectable({
  providedIn: 'root',
})
export class AuthInterceptorService implements HttpInterceptor {
  constructor(
    private _authService: AuthService,
    private _router: Router,
    private _logger: SecureLoggerService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (isStaticResource(req.url) || !isApiUrl(req.url) || isAuthUrl(req.url)) {
      return next.handle(req);
    }

    const token = this._authService.getToken();
    const headers: Record<string, string> = {
      'X-Client-App': environment.frontendClientKey
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token.trim().replace(/^Bearer\s+/i, '')}`;
    }

    return next.handle(req.clone({ setHeaders: headers })).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err?.status === 401 || err?.status === 403) {
          if (!err.url?.includes('/UserManagement/credentials')) {
            this._router.navigate(['/unauthorized']);
          }
        } else if (err?.status === 0) {
          this._logger.error('Network error detected - possible CORS or SSL issue');
        } else if (err?.status >= 500) {
          this._logger.error('Server error detected');
        }
        return throwError(() => err);
      })
    );
  }
}
