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
import { Observable, catchError, from, throwError, timer } from 'rxjs';
import { retryWhen, mergeMap, take } from 'rxjs/operators';
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
    if (req.url.startsWith(Constants.apiRoot)) {
      return from(
        this._authService.getAccessToken().then((token) => {
          const headers = new HttpHeaders().set(
            'Authorization',
            `Bearer ${token}`
          );
          const authRequest = req.clone({ headers });
                      return next
            .handle(authRequest)
            .pipe(
              retryWhen(errors => 
                errors.pipe(
                  mergeMap((err: HttpErrorResponse) => {
                    if (err.status === 429) {
                      // Retry with exponential backoff for rate limiting
                      const retryAttempt = parseInt(err.headers.get('X-Retry-After') || '1');
                      const delay = Math.min(1000 * Math.pow(2, retryAttempt), 10000); // Max 10 seconds
                      console.log(`Rate limited, retrying in ${delay}ms`);
                      return timer(delay);
                    }
                    return throwError(() => err);
                  }),
                  take(3) // Max 3 retries
                )
              ),
              catchError((err: HttpErrorResponse) => {
                if (err && (err.status === 401 || err.status === 403)) {
                  this._router.navigate(['/unauthorized']);
                } else if (err.status === 429) {
                  console.error('Rate limit exceeded after retries');
                }
                throw 'error in a request ' + err.status;
              })
            )
            .toPromise();
        })
      );
    } else {
      return next.handle(req);
    }
  }
}
