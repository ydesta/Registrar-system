import { Injectable } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // Check if we're on a login route to avoid interference
    if (state.url.includes('/accounts/login') || state.url.includes('/accounts/register')) {
      return true;
    }

    const isLoggedIn = localStorage.getItem('isLogin') === 'true';
    const hasToken = localStorage.getItem('access_token');
    const hasRefreshToken = localStorage.getItem('refresh_token');
    
    // Additional check for token storage service
    const tokenStorageIsLogin = this.authService.isAuthenticated();
    
    if (isLoggedIn && hasToken) {
      // Double-check with token storage service
      tokenStorageIsLogin.then(isAuth => {
        if (!isAuth) {
          this.clearAuthData();
          this.router.navigate(['/accounts/login']);
        }
      });
      return true;
    }
    
    // Clear any inconsistent auth data
    if (!hasToken || !isLoggedIn) {
      this.clearAuthData();
    }
    
    // Store the intended destination
    localStorage.setItem('redirectUrl', state.url);
    this.router.navigate(['/accounts/login']);
    return false;
  }

  private clearAuthData(): void {
    localStorage.removeItem('isLogin');
    localStorage.removeItem('userId');
    localStorage.removeItem('firstName');
    localStorage.removeItem('lastName');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
    localStorage.removeItem('userType');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('currentUserId');
  }
} 