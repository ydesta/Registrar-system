import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  isUserAuthenticated = false;
  currentUser: any = null;
  isUserApplicant = false;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private _authService: AuthService,
    private _router: Router
  ) {}

  ngOnInit(): void {
    this._authService.isAuthenticated().then(isAuth => this.applyAuth(isAuth));
    this._authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.applyAuth(!!user, user);
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

  private applyAuth(isAuth: boolean, user: any = this._authService.getCurrentUser()): void {
    this.isUserAuthenticated = isAuth;
    this.currentUser = user;
    this.isUserApplicant = this._authService.hasRole('Applicant')
      || localStorage.getItem('role') === '"Applicant"';
  }
}
