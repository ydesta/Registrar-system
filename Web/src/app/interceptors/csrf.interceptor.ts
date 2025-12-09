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
    // Only add CSRF token for state-changing requests to our API
    if (this.shouldAddCsrfToken(request)) {
      return this.getCsrfToken().pipe(
        switchMap(token => {
          const csrfRequest = request.clone({
            setHeaders: {
              'X-CSRF-TOKEN': token
            }
          });
          return next.handle(csrfRequest);
        })
      );
    }

    return next.handle(request);
  }

  private shouldAddCsrfToken(request: HttpRequest<unknown>): boolean {
    // Add CSRF token for POST, PUT, DELETE, PATCH requests to our API
    const method = request.method.toUpperCase();
    const isStateChanging = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
    
    // Check if request is to our API
    const apiUrl = environment.production ? 'https://hilcoe.edu.et:5001/api' : 'https://localhost:7123/api';
    const isApiRequest = request.url.startsWith(apiUrl);
    
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
      const apiUrl = environment.production ? 'https://hilcoe.edu.et:5001/api' : 'https://localhost:7123/api';
      const response = await this.http.get<{token: string}>(`${apiUrl}/authentication/csrf-token`).toPromise();
      
      if (response?.token) {
        this.csrfToken = response.token;
        return this.csrfToken;
      }
      
      throw new Error('No CSRF token received');
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
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
