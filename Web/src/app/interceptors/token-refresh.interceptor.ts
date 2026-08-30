import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { isAuthUrl, isStaticResource } from '../constants';

@Injectable()
export class TokenRefreshInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (isStaticResource(request.url) || isAuthUrl(request.url)) {
      return next.handle(request);
    }

    const accessToken = this.authService.getToken();
    if (accessToken) {
      request = this.addToken(request, accessToken);
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && !request.url.includes('/authentication/refresh-token')) {
          return this.handle401Error(request, next);
        }
        return throwError(() => error);
      })
    );
  }

  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token.trim().replace(/^Bearer\s+/i, '')}`
      }
    });
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.isRefreshing) {
      return this.refreshTokenSubject.pipe(
        filter((token): token is string => token !== null),
        take(1),
        switchMap(token => next.handle(this.addToken(request, token)))
      );
    }

    this.isRefreshing = true;
    this.refreshTokenSubject.next(null);
    const refreshToken = this.authService.getRefreshToken();
    const accessToken = this.authService.getToken();
    if (!refreshToken || !accessToken) {
      return this.failRefresh();
    }

    return this.authService.refreshToken(accessToken, refreshToken).pipe(
      switchMap((response: any) => {
        this.isRefreshing = false;
        const nextAccess = response.accessToken?.token;
        const nextRefresh = response.refreshToken?.token;
        if (!nextAccess || !nextRefresh) {
          return this.failRefresh();
        }
        this.authService.saveTokens(nextAccess, nextRefresh);
        this.refreshTokenSubject.next(nextAccess);
        return next.handle(this.addToken(request, nextAccess));
      }),
      catchError(error => {
        this.failRefresh();
        return throwError(() => error);
      })
    );
  }

  private failRefresh(): Observable<never> {
    this.isRefreshing = false;
    this.authService.logout();
    this.router.navigate(['/accounts/login']);
    return throwError(() => new Error('Token refresh failed'));
  }
}
