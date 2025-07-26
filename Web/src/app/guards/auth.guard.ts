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
    const isLoggedIn = localStorage.getItem('isLogin') === 'true';
    const hasToken = localStorage.getItem('access_token');
    const hasRefreshToken = localStorage.getItem('refresh_token');
    if (isLoggedIn && hasToken) {
      return true;
    }
    if (!hasToken) {
      localStorage.removeItem('isLogin');
      localStorage.removeItem('userId');
      localStorage.removeItem('firstName');
      localStorage.removeItem('lastName');
      localStorage.removeItem('email');
      localStorage.removeItem('role');
      localStorage.removeItem('userType');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
    localStorage.setItem('redirectUrl', state.url);
    this.router.navigate(['/accounts/login']);
    return false;
  }
} 