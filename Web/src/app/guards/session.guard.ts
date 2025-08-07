import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SessionManagementService } from '../services/session-management.service';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SessionGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private sessionManagementService: SessionManagementService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return new Observable<boolean>(observer => {
      // Skip session check for auth routes
      if (state.url.includes('/accounts/login') || 
          state.url.includes('/accounts/register') ||
          state.url.includes('/accounts/forgot-password') ||
          state.url.includes('/accounts/reset-password') ||
          state.url.includes('/accounts/verify-email')) {
        observer.next(true);
        observer.complete();
        return;
      }

      this.authService.isAuthenticated().then(isAuthenticated => {
        if (!isAuthenticated) {
          this.router.navigate(['/accounts/login'], { 
            queryParams: { returnUrl: state.url } 
          });
          observer.next(false);
          observer.complete();
          return;
        }

        const sessionInfo = this.sessionManagementService.getSessionInfo();
        if (!sessionInfo.isActive) {
          this.authService.logout();
          this.router.navigate(['/accounts/login'], { 
            queryParams: { returnUrl: state.url, reason: 'session_expired' } 
          });
          observer.next(false);
          observer.complete();
          return;
        }

        if (sessionInfo.isWarning) {
          // Show warning but allow access
          console.warn('Session warning: Session will expire soon');
        }

        observer.next(true);
        observer.complete();
      }).catch(error => {
        console.error('Session guard error:', error);
        // On error, allow access but log the issue
        observer.next(true);
        observer.complete();
      });
    });
  }
} 