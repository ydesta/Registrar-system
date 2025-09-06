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
    }).catch((error) => {
      // Set default state on error
      this.isAuthenticated = false;
      this.currentUser = null;
      this.isUserApplicant = false;
    });
  }

  public login = () => {
    // Close mobile menu first
    this.closeMobileMenu();
    
    // Use absolute navigation to ensure it works from any portal route
    this._router.navigate(['/accounts/login']).then(() => {
      // Navigation successful
    }).catch((error) => {
      // Fallback: try using window.location
      window.location.href = '/accounts/login';
    });
  };

  public register = () => {
    // Close mobile menu first
    this.closeMobileMenu();
    
    // Use absolute navigation to ensure it works from any portal route
    this._router.navigate(['/accounts/register']).then(() => {
      // Navigation successful
    }).catch((error) => {
      // Fallback: try using window.location
      window.location.href = '/accounts/register';
    });
  };

  public logout = () => {
    this.closeMobileMenu();
    
    this._authService.logout();
    
    // Reset component state
    this.isAuthenticated = false;
    this.currentUser = null;
    this.isUserApplicant = false;
    
    // Navigate to portal home
    this.goToHome();
  };

  public goToHome = () => {
    this._router.navigate(['/portal']).then(() => {
      // Navigation successful
    }).catch((error) => {
      // Navigation failed
    });
  };

  public goToDashboard = () => {
    this._router.navigate(['/dashboard']).then(() => {
      // Navigation successful
    }).catch((error) => {
      // Navigation failed
    });
  };

  public isOnMainPortalRoute(): boolean {
    const currentUrl = this._router.url;
    
    // Only show main portal content when on exact /portal route
    // Don't show it when on child routes like /portal/about, /portal/programs, etc.
    const isMainRoute = currentUrl === '/portal' || currentUrl === '/portal/';
    return isMainRoute;
  }

  public isLinkActive(route: string): boolean {
    const currentUrl = this._router.url;
    const isActive = currentUrl.includes(route);
    return isActive;
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