import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpClient
} from '@angular/common/http';
import { Observable, from, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable()
export class CsrfInterceptor implements HttpInterceptor {
  private csrfToken: string | null = null;
  private tokenPromise: Promise<string> | null = null;

  constructor(private http: HttpClient) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Check if request is to our API (both secureUrl and baseUrl)
    const isSecureApiRequest = request.url.startsWith(environment.secureUrl);
    const isBaseApiRequest = request.url.startsWith(environment.baseUrl);
    const isApiRequest = isSecureApiRequest || isBaseApiRequest;
    
    if (!isApiRequest) {
      return next.handle(request);
    }

    // Always add X-Client-App header for all API requests
    // Only add CSRF token for state-changing requests
    if (this.shouldAddCsrfToken(request)) {
      return this.getCsrfToken().pipe(
        switchMap(token => {
          const csrfRequest = request.clone({
            setHeaders: {
              'X-CSRF-TOKEN': token,
              'X-Client-App': environment.frontendClientKey // Required header to identify frontend requests
            }
          });
          return next.handle(csrfRequest);
        })
      );
    }

    // For non-state-changing requests, still add the client header
    const clientHeaderRequest = request.clone({
      setHeaders: {
        'X-Client-App': environment.frontendClientKey // Required header to identify frontend requests
      }
    });
    return next.handle(clientHeaderRequest);
  }

  private shouldAddCsrfToken(request: HttpRequest<unknown>): boolean {
    // Exclude authentication endpoints from CSRF token requirement
    // These endpoints are public and don't require CSRF protection
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
      return false;
    }
    
    // Add CSRF token for POST, PUT, DELETE, PATCH requests to our API
    const method = request.method.toUpperCase();
    const isStateChanging = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
    
    // Check if request is to our API (both secureUrl and baseUrl)
    const isSecureApiRequest = request.url.startsWith(environment.secureUrl);
    const isBaseApiRequest = request.url.startsWith(environment.baseUrl);
    const isApiRequest = isSecureApiRequest || isBaseApiRequest;
    
    return isStateChanging && isApiRequest;
  }

  private getCsrfToken(): Observable<string> {
    // Return cached token if available
    if (this.csrfToken) {
      return new Observable(observer => {
        observer.next(this.csrfToken!);
        observer.complete();
      });
    }

    // Return existing promise if token is being fetched
    if (this.tokenPromise) {
      return from(this.tokenPromise);
    }

    // Fetch new token
    this.tokenPromise = this.fetchCsrfToken();
    return from(this.tokenPromise);
  }

  private async fetchCsrfToken(): Promise<string> {
    try {
      const apiUrl = environment.secureUrl;
      const response = await this.http.get<{token: string}>(`${apiUrl}/authentication/csrf-token`).toPromise();
      
      if (response?.token) {
        this.csrfToken = response.token;
        return this.csrfToken;
      }
      
      throw new Error('No CSRF token received');
    } catch (error) {
      // Return empty token as fallback - the server will handle validation
      return '';
    }
  }

  // Method to refresh CSRF token when needed
  public refreshCsrfToken(): void {
    this.csrfToken = null;
    this.tokenPromise = null;
  }
}
