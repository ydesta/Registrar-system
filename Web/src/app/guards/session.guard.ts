import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SessionManagementService } from '../services/session-management.service';
import { Observable } from 'rxjs';
import { isPublicAuthRoute } from '../constants';

@Injectable({
  providedIn: 'root'
})
export class SessionGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private sessionManagementService: SessionManagementService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return new Observable<boolean>(observer => {
      if (isPublicAuthRoute(state.url)) {
        observer.next(true);
        observer.complete();
        return;
      }

      this.authService.isAuthenticated().then(isAuthenticated => {
        if (!isAuthenticated) {
          this.router.navigate(['/accounts/login'], { queryParams: { returnUrl: state.url } });
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

        observer.next(true);
        observer.complete();
      }).catch(() => {
        observer.next(true);
        observer.complete();
      });
    });
  }
}
