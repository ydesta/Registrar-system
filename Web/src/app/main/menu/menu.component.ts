import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
})
export class MenuComponent implements OnInit, OnDestroy {
  isCollapsed = true;
  isLogin = false;
  currentDate = Date();
  shortUserName = '';
  userType = '';
  isUserAdmin = false;
  isUserAuthenticated = false;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private _authService: AuthService,
    private _router: Router
  ) {}

  ngOnInit(): void {
    this._authService.isAuthenticated().then(isAuth => {
      this.isUserAuthenticated = isAuth;
    });
    this._authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.isUserAuthenticated = !!user;
      if (user) {
        this.shortUserName = `${user.firstName} ${user.lastName}`;
        this.isUserAdmin = this.isAdmin();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  login = () => {
    this._router.navigate(['/accounts/login']);
  };

  logout = () => {
    this._authService.logout();
  };

  isAdmin = () => {
    this.isUserAdmin = this._authService.hasRole('Administrator') || this._authService.hasRole('Admin');
    return this.isUserAdmin;
  };
}
