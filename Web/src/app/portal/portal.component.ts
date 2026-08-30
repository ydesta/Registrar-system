import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-portal',
  templateUrl: './portal.component.html',
  styleUrls: ['./portal.component.scss']
})
export class PortalComponent implements OnInit, OnDestroy {
  isUserApplicant = false;
  isAuthenticated = false;
  currentUser: any = null;
  isMobileMenuOpen = false;
  currentYear = new Date().getFullYear();
  private readonly destroy$ = new Subject<void>();

  constructor(
    private _authService: AuthService,
    private _router: Router
  ) {}

  ngOnInit(): void {
    this._authService.isAuthenticated().then(isAuth => this.applyAuth(isAuth)).catch(() => this.resetAuth());
    this._authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.applyAuth(!!user, user);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  login = () => {
    this.navigate('/accounts/login');
  };

  register = () => {
    this.navigate('/accounts/register');
  };

  logout = () => {
    this.closeMobileMenu();
    this.resetAuth();
    this._authService.logout();
  };

  goToHome = () => {
    this._router.navigate(['/portal']);
  };

  goToDashboard = () => {
    this._router.navigate(['/dashboard']);
  };

  isOnMainPortalRoute(): boolean {
    const currentUrl = this._router.url;
    return currentUrl === '/portal' || currentUrl === '/portal/';
  }

  isLinkActive(route: string): boolean {
    return this._router.url.includes(route);
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    if (event.target.innerWidth > 768 && this.isMobileMenuOpen) {
      this.isMobileMenuOpen = false;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: any): void {
    const target = event.target as HTMLElement;
    if (this.isMobileMenuOpen && !target.closest('.main-nav') && !target.closest('.mobile-menu-toggle')) {
      this.closeMobileMenu();
    }
  }

  private applyAuth(isAuth: boolean, user: any = this._authService.getCurrentUser()): void {
    this.isAuthenticated = isAuth;
    this.currentUser = user;
    this.isUserApplicant = this._authService.hasRole('Applicant')
      || localStorage.getItem('role') === '"Applicant"';
  }

  private resetAuth(): void {
    this.isAuthenticated = false;
    this.currentUser = null;
    this.isUserApplicant = false;
  }

  private navigate(path: string): void {
    this.closeMobileMenu();
    this._router.navigate([path]).catch(() => {
      window.location.href = path;
    });
  }
}
