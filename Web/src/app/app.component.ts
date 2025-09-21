import { AfterViewInit, ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from './services/auth.service';
import { SharedDataService } from './services/shared-data.service';
import { CrudService } from './services/crud.service';
import { BatchTermService } from './colleges/services/batch-term.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SessionManagementService } from './services/session-management.service';
import { Subscription } from 'rxjs';
import { environment } from '../environments/environment';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  isDarkTheme = true;
  isCollapsed = true;
  isLogin = false;
  isAuthRoute = false;
  isPortalRoute = false;
  currentDate = Date();
  shortUserName = 'Welcome';
  userType = '';
  userAvatarUrl: string | null = null;
  userEmail: string | null = null;
  public isUserAdmin: boolean = false;
  public isUserInstructor: boolean = false;
  public isUserStudent: boolean = false;
  public isUserApplicant: boolean = false;
  public isUserReviewer: boolean = false;
  public isUserAuthenticated: boolean = false;
  public isUserApprovedApplicant: boolean = false;
  public isUserAlreadyApplied: boolean = false;
  public isUserFinance: boolean = false;
  public isUserAcademicDirector: boolean = false;
  public isUserReception: boolean = false;
  nextAcademicTerm: any;
  nextTerm = '';
  nextTermYear: number;
  academicTermId = 0;
  public currentUser: any = null;
  private redirectInProgress = false;
  private initialLoadComplete = false;

  private sessionSubscription: Subscription = new Subscription();

  constructor(
    private _authService: AuthService,
    private sharedDataService: SharedDataService,
    private _crudService: CrudService,
    private cdRef: ChangeDetectorRef,
    private batchTermService: BatchTermService,
    private _router: Router,
    private sessionManagementService: SessionManagementService,

  ) {
  }

  ngOnInit(): void {
    // Log environment configuration for debugging
    if (environment.production) {
      console.log('Production Environment Configuration:', {
        secureUrl: environment.secureUrl,
        baseUrl: environment.baseUrl,
        fileUrl: environment.fileUrl
      });
    }
    
    this.getNextAcademicTerm();
    this.initializeUserData();
    
    // Subscribe to authentication state changes
    this._authService.isAuthenticated().then(isAuth => {
      this.isUserAuthenticated = isAuth;
      this.currentUser = this._authService.getCurrentUser();
      this.isUserAdmin = this._authService.hasRole('Administrator') || this._authService.hasRole('Admin');
      this.initializeUserData();
      this.cdRef.detectChanges();
    }).catch(error => {
      console.error('Authentication check failed:', error);
      // If authentication check fails, clear cache and retry
      this.handleAuthFailure();
    });

    // Subscribe to current user changes
    this._authService.currentUser$.subscribe(user => {
      this.isUserAuthenticated = !!user;
      this.currentUser = user;
      this.isUserAdmin = this._authService.hasRole('Administrator') || this._authService.hasRole('Admin');
      this.initializeUserData();
      this.cdRef.detectChanges();
    }, error => {
      console.error('User subscription error:', error);
      this.handleAuthFailure();
    });

    // Subscribe to authentication state changes
    this._authService.isAuthenticated$.subscribe(isAuth => {
      this.isUserAuthenticated = isAuth;
      if (isAuth) {
        this.initializeUserData();
      } else {
        this.resetUserData();
      }
      this.cdRef.detectChanges();
    });

    // Monitor route changes
    this._router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      // Mark initial load as complete after first route change
      if (!this.initialLoadComplete) {
        this.initialLoadComplete = true;
      }
      
      const shouldBeLoggedIn = localStorage.getItem('isLogin') === 'true';
      if (this.isLogin !== shouldBeLoggedIn) {
        this.isLogin = shouldBeLoggedIn;
        if (shouldBeLoggedIn) {
          this.initializeUserData();
        }
        this.cdRef.detectChanges();
      }
      this.checkIfAuthRoute();
      if (this.isUserApplicant || this.userType === 'Applicant') {
        this.redirectApplicantToAdmissionRequest();
      }
    });

    // Handle login success events
    this.sharedDataService.share.subscribe((data: any) => {
      if (data && data.type === 'LOGIN_SUCCESS') {
        this.isCollapsed = false; // Open the sidebar
        if (data.user) {
          if (data.user.id) localStorage.setItem('user_id', data.user.id);
          if (data.user.firstName) localStorage.setItem('firstName', data.user.firstName);
          if (data.user.lastName) localStorage.setItem('lastName', data.user.lastName);
          if (data.user.email) localStorage.setItem('email', data.user.email);
          if (data.user.role) {
            if (Array.isArray(data.user.role)) {
              localStorage.setItem('role', JSON.stringify(data.user.role));
              localStorage.setItem('userType', data.user.role[0] || '');
            } else {
              localStorage.setItem('role', data.user.role);
              localStorage.setItem('userType', data.user.role);
            }
          }
        }
        this.initializeUserData();
        if (this.isUserApplicant || this.userType === 'Applicant') {
          this.redirectApplicantToAdmissionRequest();
        }
        
        this.cdRef.detectChanges();
      }
    });

    // Monitor localStorage changes
    window.addEventListener('storage', (event) => {
      if (event.key === 'isLogin') {
        this.initializeUserData();
        if (this.isUserApplicant || this.userType === 'Applicant') {
          this.redirectApplicantToAdmissionRequest();
        }
        
        this.cdRef.detectChanges();
      }
    });

    this.checkIfAuthRoute();
  }

  private checkIfAuthRoute() {
    const currentUrl = this._router.url;
    
    this.isAuthRoute = currentUrl.includes('/accounts/login') ||
      currentUrl.includes('/accounts/register') ||
      currentUrl.includes('/accounts/forgot-password') ||
      currentUrl.includes('/accounts/reset-password') ||
      currentUrl.includes('/accounts/verify-email') ||
      currentUrl.includes('/accounts/change-password') ||
      currentUrl.includes('/forgot-password') ||
      currentUrl.includes('/reset-password');
    this.isPortalRoute = currentUrl.includes('/portal');
    
  }

  ngAfterViewInit(): void {
    this.cdRef.detectChanges();
  }

  ngOnDestroy(): void {
    this.sessionSubscription.unsubscribe();
    this.sessionManagementService.destroy();
  }

  getNextAcademicTerm() {
    this.batchTermService.getNextAcademicTerm().subscribe((res: any) => {
      sessionStorage.setItem('nextAcademicTerm', JSON.stringify(res));
    });
  }

  private initializeUserData() {
    try {
      if (localStorage.getItem('isLogin') === 'true') {
        this.isLogin = true;
        this.isCollapsed = false;
        const firstName = localStorage.getItem('firstName');
        const lastName = localStorage.getItem('lastName');
        this.userEmail = localStorage.getItem('email');
        const userType = localStorage.getItem('userType');
        const role = localStorage.getItem('role');
                
        if (firstName || lastName) {
          const names = [firstName, lastName].filter(Boolean);
          this.shortUserName = names.join(' ');
        } else if (this.userEmail) {
          this.shortUserName = this.userEmail;
        } else {
          this.shortUserName = 'Welcome';
        }
        if (userType) {
          this.setUserRole(userType);
        } else if (role) {
          try {
            const roles = JSON.parse(role);
            if (Array.isArray(roles) && roles.length > 0) {
              this.setUserRole(roles[0]);
            } else {
              this.setUserRole(role);
            }
          } catch {
            this.setUserRole(role);
          }
        }
        if (this.isUserApplicant || userType === 'Applicant' || role === 'Applicant') {
          this.redirectApplicantToAdmissionRequest();
        }
        if (this.isUserReviewer || userType === 'Reviewer' || role === 'Reviewer') {
          // Add a small delay to ensure route is fully loaded
          setTimeout(() => {
            this.redirectReviewerToApplicantRequestList();
          }, 100);
        }
        this.getUserDataFromApi();
      } else {
        this.resetUserData();
      }
    } catch (ex) {
      this.resetUserData();
    }
  }

  private getUserDataFromApi() {
    const firstName = localStorage.getItem('firstName');
    const lastName = localStorage.getItem('lastName');
    const email = localStorage.getItem('email');
    const userType = localStorage.getItem('userType');
    const role = localStorage.getItem('role');
    this.shortUserName = [firstName, lastName].filter(Boolean).join(' ') || email || 'Welcome';
    this.userEmail = email;
    this.userType = userType || role || '';
    if (this.userType) {
      this.setUserRole(this.userType);
    } else if (role) {
      try {
        const roles = JSON.parse(role);
        if (Array.isArray(roles) && roles.length > 0) {
          this.setUserRole(roles[0]);
        } else {
          this.setUserRole(role);
        }
      } catch {
        this.setUserRole(role);
      }
    }

    // Check if user is applicant and redirect if needed
    if (this.isUserApplicant || this.userType === 'Applicant' || role === 'Applicant') {
      this.redirectApplicantToAdmissionRequest();
    }
    
    
    if (this.isUserReviewer || this.userType === 'Reviewer' || role === 'Reviewer') {
      // Add a small delay to ensure route is fully loaded
      setTimeout(() => {
        this.redirectReviewerToApplicantRequestList();
      }, 100);
    }

    this.cdRef.detectChanges();
  }

  private setUserRole(role: string) {
    const cleanRole = role.replace(/"/g, '').trim();
    this.isUserAdmin = false;
    this.isUserInstructor = false;
    this.isUserStudent = false;
    this.isUserReviewer = false;
    this.isUserApplicant = false;
    this.isUserApprovedApplicant = false;
    
    switch (cleanRole) {
      case 'Super Admin':
      case 'Admin':
      case 'Administrator':
        this.isUserAdmin = true;
        this.userType = cleanRole;
        break;
      case 'Instructor':
        this.isUserInstructor = true;
        this.userType = cleanRole;
        break;
      case 'Student':
        this.isUserStudent = true;
        this.userType = cleanRole;
        break;
      case 'Reviewer':
        this.isUserReviewer = true;
        this.userType = cleanRole;
       // this.redirectReviewerToApplicantRequestList();
        break;
      case 'Applicant':
        this.checkApplicantStatus();
        this.isUserApplicant = true;
        this.userType = cleanRole;
        this.redirectApplicantToAdmissionRequest();
        break;
      case 'ApprovedApplicant':
        this.isUserApprovedApplicant = true;
        this.userType = 'Student';
        break;
      case 'Finance':
        this.isUserFinance = true;
        this.userType = cleanRole;
        break;
      case 'Reception':
        this.isUserReception = true;
        this.userType = cleanRole;
        break;
      case 'Academic Director':
        this.isUserAcademicDirector = true;
        this.userType = cleanRole;
        break;
      default:
        console.log('Unknown role:', cleanRole);
        break;
    }
  }

  private resetUserData() {
    this.isLogin = false;
    this.shortUserName = 'Welcome';
    this.userType = '';
    this.isUserAdmin = false;
    this.isUserInstructor = false;
    this.isUserStudent = false;
    this.isUserApplicant = false;
    this.isUserReviewer = false;
    this.isUserApprovedApplicant = false;
    this.isUserAlreadyApplied = false;
    this.isUserFinance = false;
  }

  private checkApplicantStatus() {
    const userId = localStorage.getItem('user_id');
    if (userId) {
      this._crudService
        .getList('/Applicants/ByApplicantUserId/' + userId)
        .subscribe({
          next: (res: any) => {
            if (res.data) {
              this.isUserAlreadyApplied = true;
            } else {
              this.isUserApplicant = true;
            }
            this.cdRef.detectChanges(); 
          },
          error: (error) => {
            this.isUserApplicant = true;
            this.cdRef.detectChanges(); 
          }
        });
    }
  }

  private redirectApplicantToAdmissionRequest() {
    const currentUrl = this._router.url;
    const shouldRedirect = !currentUrl.includes('/student-application') && 
                          !currentUrl.includes('/accounts') &&
                          !currentUrl.includes('/portal');
    
    if (shouldRedirect) {
      this._router.navigate(['/student-application/admission-request']);
    }
  }

  private redirectReviewerToApplicantRequestList() {
    // Prevent multiple redirects
    if (this.redirectInProgress) {
      return;
    }

    // Don't redirect during initial page load
    if (!this.initialLoadComplete) {
      return;
    }

    const currentUrl = this._router.url;
    
    // Don't redirect if user is already on a reviewer page
    const isOnReviewerPage = currentUrl.includes('/student-application/applicant-request-list') || 
                            currentUrl.includes('/student-application/applicant-request-detail') ||
                            currentUrl.includes('/student-application/applicant-incomplete');
    
    // Also check if we're on the root or any other non-reviewer page
    const isOnRootOrOtherPage = currentUrl === '/' || 
                               currentUrl === '/student-application' ||
                               (!currentUrl.includes('/student-application/') && !currentUrl.includes('/accounts') && !currentUrl.includes('/portal'));
    
    const shouldRedirect = !isOnReviewerPage && isOnRootOrOtherPage;
    
    if (shouldRedirect) {
      this.redirectInProgress = true;
      this._router.navigate(['/student-application/applicant-request-list']).then(() => {
        this.redirectInProgress = false;
      });
    }
  }

  public login = () => {
    this._router.navigate(['/accounts/login']);
  };

  public logout = () => {
    this.resetUserData();
    localStorage.clear();
    this._authService.logout();
  };

  public goToHome = () => {
    this._router.navigate(['/portal']);
  };

  public goToProgram = () => {
    this._router.navigate(['/acadamic-programme']);
  };

  public changePassword = () => {
    this._router.navigate(['/accounts/change-password']);
  };

  public goToProfile = () => {
    const userId = this.currentUser?.id || localStorage.getItem('user_id');
    if (userId) {
      this._router.navigate(['/user-management/user', userId]);
    } else {
      this._router.navigate(['/user-management/users']);
    }
  };
  onMenuClick(route: string) {
  }

  // Public getter for current URL
  get currentUrl(): string {
    return this._router.url;
  }



  private handleAuthFailure(): void {
    console.warn('Authentication check failed. Retrying.');
    this.initializeUserData(); // Re-initialize user data to force a fresh login attempt
    this.cdRef.detectChanges();
  }
}
