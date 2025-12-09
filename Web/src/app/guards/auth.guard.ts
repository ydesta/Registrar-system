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
    if (state.url.includes('/accounts/login') || 
        state.url.includes('/accounts/register') ||
        state.url.includes('/accounts/forgot-password') ||
        state.url.includes('/accounts/reset-password') ||
        state.url.includes('/accounts/verify-email')) {
      return true;
    }

    const isLoggedIn = localStorage.getItem('isLogin') === 'true';
    const hasToken = localStorage.getItem('access_token');
    
    // Check if token exists
    if (!hasToken) {
      this.handleUnauthorizedAccess(state.url);
      return false;
    }

    // Check token expiration
    try {
      const token = this.parseJwtToken(hasToken);
      if (token && token.exp) {
        const expirationDate = new Date(token.exp * 1000);
        const now = new Date();
        
        // Check if token is expired or will expire in the next 60 seconds
        if (expirationDate <= now || (expirationDate.getTime() - now.getTime()) < 60000) {
          console.log('Token is expired or about to expire');
          this.handleUnauthorizedAccess(state.url, 'token_expired');
          return false;
        }
      }
    } catch (error) {
      console.error('Error parsing token:', error);
      this.handleUnauthorizedAccess(state.url);
      return false;
    }
    
    if (isLoggedIn && hasToken) {
      return true;
    }
    
    this.handleUnauthorizedAccess(state.url);
    return false;
  }

  private handleUnauthorizedAccess(url: string, reason?: string): void {
    console.log(`Unauthorized access attempt to: ${url}`);
    
    // Clear any inconsistent auth data
    this.clearAuthData();
    
    // Store the intended destination
    const queryParams: any = { returnUrl: url };
    if (reason) {
      queryParams.reason = reason;
    }
    
    this.router.navigate(['/accounts/login'], { queryParams });
  }

  private parseJwtToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      return null;
    }
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