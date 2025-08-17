import { Component, OnInit, HostListener } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-portal',
  templateUrl: './portal.component.html',
  styleUrls: ['./portal.component.scss']
})
export class PortalComponent implements OnInit {
  public isUserApplicant: boolean = false;
  public isAuthenticated: boolean = false;
  public currentUser: any = null;
  public isMobileMenuOpen: boolean = false;
  currentYear: number = new Date().getFullYear();

  constructor(
    private _authService: AuthService,
    private _router: Router
  ) {
    
   }

  ngOnInit(): void {
    this._authService.isAuthenticated().then(isAuth => {
      this.isAuthenticated = isAuth;
      this.currentUser = this._authService.getCurrentUser();
      if (localStorage.getItem('role') == '"Applicant"') {
        this.isUserApplicant = true;
      }
    });
  }

  public login = () => {
    // Use the new API-based login
    this._router.navigate(['/accounts/login']);
  };

  public register = () => {
    this._router.navigate(['/accounts/register']);
  };

  public logout = () => {
    this._authService.logout();
  };

  public goToHome = () => {
    this._router.navigate(['/portal']);
  };

  public goToDashboard = () => {
    this._router.navigate(['/dashboard']);
  };

  public isOnMainPortalRoute(): boolean {
    const currentUrl = this._router.url;
    // Only show main portal content when on exact /portal route
    // Don't show it when on child routes like /portal/about, /portal/programs, etc.
    return currentUrl === '/portal' || currentUrl === '/portal/';
  }

  public isLinkActive(route: string): boolean {
    const currentUrl = this._router.url;
    return currentUrl.includes(route);
  }

  public toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  public closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    // Close mobile menu when screen size increases beyond mobile breakpoint
    if (event.target.innerWidth > 768 && this.isMobileMenuOpen) {
      this.isMobileMenuOpen = false;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: any): void {
    // Close mobile menu when clicking outside
    const target = event.target as HTMLElement;
    const mobileMenu = target.closest('.main-nav');
    const mobileToggle = target.closest('.mobile-menu-toggle');
    
    if (this.isMobileMenuOpen && !mobileMenu && !mobileToggle) {
      this.closeMobileMenu();
    }
  }
} 