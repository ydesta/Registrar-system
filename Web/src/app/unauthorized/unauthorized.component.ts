import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-unauthorized',
  templateUrl: './unauthorized.component.html',
  styleUrls: ['./unauthorized.component.scss'],
})
export class UnauthorizedComponent implements OnInit, OnDestroy {
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
}
