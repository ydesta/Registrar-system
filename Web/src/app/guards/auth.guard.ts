import { Injectable } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { isPublicAuthRoute } from '../constants';
import { SESSION_CONSTANTS } from '../services/session-management.constants';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (isPublicAuthRoute(state.url)) {
      return true;
    }
    const isLoggedIn = localStorage.getItem('isLogin') === 'true';
    const hasToken = !!this.authService.getToken();
    if (isLoggedIn && hasToken) {
      return true;
    }
    this.handleUnauthorizedAccess(state.url, hasToken ? undefined : 'token_expired');
    return false;
  }

  private handleUnauthorizedAccess(url: string, reason?: string): void {
    this.authService.clearTokens();
    SESSION_CONSTANTS.AUTH_KEYS.forEach(key => localStorage.removeItem(key));
    const queryParams: Record<string, string> = { returnUrl: url };
    if (reason) {
      queryParams['reason'] = reason;
    }
    this.router.navigate(['/accounts/login'], { queryParams });
  }
}
