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
    if (!roles) {
      return this.checkIsUserAuthenticated();
    } else {
      return this.checkForRequiredRoles(roles);
    }
  }

  private checkIsUserAuthenticated() {
    // Use localStorage-based authentication
    const isLoggedIn = localStorage.getItem('isLogin') === 'true';
    const hasToken = localStorage.getItem('access_token');

    if (isLoggedIn && hasToken) {
      return true;
    } else {
      return this.redirectToUnauthorized();
    }
  }

  private checkForRequiredRoles(requiredRoles: string[]) {
    const userRoles = this.getUserRoles();

    // Check if user has any of the required roles
    // Super Admin has access to everything
    const hasRequiredRole = userRoles.some(role => 
      requiredRoles.includes(role) ||
      role === 'Super Admin'
    );

    return hasRequiredRole ? true : this.redirectToUnauthorized();
  }

  private getUserRoles(): string[] {
    const userRole = localStorage.getItem('role');
    const userType = localStorage.getItem('userType');
    const roles: string[] = [];

    // Add userType if it exists
    if (userType) {
      roles.push(userType);
    }

    // Add role if it exists
    if (userRole) {
      try {
        const parsedRoles = JSON.parse(userRole);
        if (Array.isArray(parsedRoles)) {
          roles.push(...parsedRoles);
        } else {
          roles.push(userRole);
        }
      } catch {
        roles.push(userRole);
      }
    }

    return roles;
  }

  private redirectToUnauthorized() {
    this._router.navigate(['/unauthorized']);
    return false;
  }
}
