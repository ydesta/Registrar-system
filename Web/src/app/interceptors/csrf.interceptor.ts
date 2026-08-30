import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpClient
} from '@angular/common/http';
import { Observable, from, of, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';
import { isApiUrl, isAuthUrl, isStaticResource } from '../constants';

@Injectable()
export class CsrfInterceptor implements HttpInterceptor {
  private csrfToken: string | null = null;
  private tokenPromise: Promise<string> | null = null;

  constructor(private http: HttpClient) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (isStaticResource(request.url) || !isApiUrl(request.url)) {
      return next.handle(request);
    }

    if (this.shouldAddCsrfToken(request)) {
      return this.getCsrfToken().pipe(
        switchMap(token => next.handle(request.clone({
          setHeaders: {
            'X-CSRF-TOKEN': token,
            'X-Client-App': environment.frontendClientKey
          }
        })))
      );
    }

    return next.handle(request.clone({
      setHeaders: {
        'X-Client-App': environment.frontendClientKey
      }
    }));
  }

  public refreshCsrfToken(): void {
    this.csrfToken = null;
    this.tokenPromise = null;
  }

  private shouldAddCsrfToken(request: HttpRequest<unknown>): boolean {
    if (isAuthUrl(request.url)) {
      return false;
    }
    return ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method.toUpperCase());
  }

  private getCsrfToken(): Observable<string> {
    if (this.csrfToken) {
      return of(this.csrfToken);
    }
    if (!this.tokenPromise) {
      this.tokenPromise = this.fetchCsrfToken();
    }
    return from(this.tokenPromise);
  }

  private async fetchCsrfToken(): Promise<string> {
    try {
      const response = await this.http
        .get<{ token: string }>(`${environment.secureUrl}/authentication/csrf-token`)
        .toPromise();
      if (response?.token) {
        this.csrfToken = response.token;
        return this.csrfToken;
      }
      return '';
    } catch {
      return '';
    }
  }
}
