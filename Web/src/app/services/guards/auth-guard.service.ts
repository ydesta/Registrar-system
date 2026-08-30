import { AuthService } from '../auth.service';
import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
} from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthGuardService {
  constructor(private _authService: AuthService, private _router: Router) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const roles = route.data['roles'] as Array<string>;
    return roles ? this.checkForRequiredRoles(roles) : this.checkIsUserAuthenticated();
  }

  private checkIsUserAuthenticated() {
    const isLoggedIn = localStorage.getItem('isLogin') === 'true';
    const hasToken = this._authService.getToken();
    return isLoggedIn && hasToken ? true : this.redirectToUnauthorized();
  }

  private checkForRequiredRoles(requiredRoles: string[]) {
    const hasRequiredRole = this.getUserRoles().some(role =>
      requiredRoles.includes(role) || role === 'Super Admin'
    );
    return hasRequiredRole ? true : this.redirectToUnauthorized();
  }

  private getUserRoles(): string[] {
    const userRole = localStorage.getItem('role');
    const userType = localStorage.getItem('userType');
    const roles: string[] = [];
    if (userType) {
      roles.push(userType);
    }
    if (!userRole) {
      return roles;
    }
    try {
      const parsedRoles = JSON.parse(userRole);
      roles.push(...(Array.isArray(parsedRoles) ? parsedRoles : [userRole]));
    } catch {
      roles.push(userRole);
    }
    return roles;
  }

  private redirectToUnauthorized() {
    this._router.navigate(['/unauthorized']);
    return false;
  }
}
