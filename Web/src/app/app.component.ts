import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject, filter, takeUntil } from 'rxjs';
import { AuthService } from './services/auth.service';
import { SharedDataService } from './services/shared-data.service';
import { CrudService } from './services/crud.service';
import { BatchTermService } from './colleges/services/batch-term.service';
import { SessionManagementService } from './services/session-management.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  isCollapsed = true;
  isLogin = false;
  isAuthRoute = false;
  isPortalRoute = false;
  currentDate = Date();
  shortUserName = 'Welcome';
  userType = '';
  userEmail: string | null = null;
  isUserAdmin = false;
  isUserInstructor = false;
  isUserStudent = false;
  isUserApplicant = false;
  isUserReviewer = false;
  isUserAuthenticated = false;
  isUserApprovedApplicant = false;
  isUserAlreadyApplied = false;
  isUserFinance = false;
  isUserAcademicDirector = false;
  isUserReception = false;
  isUserSectionReportViewer = false;
  isUserDepartmentHead = false;
  currentUser: any = null;

  private redirectInProgress = false;
  private initialLoadComplete = false;
  private readonly destroy$ = new Subject<void>();
  private readonly authRoutes = [
    '/accounts/login',
    '/accounts/register',
    '/accounts/forgot-password',
    '/accounts/reset-password',
    '/accounts/verify-email',
    '/accounts/change-password',
    '/forgot-password',
    '/reset-password'
  ];
  private readonly reviewerRoutes = [
    '/student-application/applicant-request-list',
    '/student-application/applicant-request-detail',
    '/student-application/applicant-incomplete'
  ];
  private readonly storageListener = (event: StorageEvent) => {
    if (event.key === 'isLogin') {
      this.initializeUserData();
      this.redirectApplicantToAdmissionRequest();
      this.cdRef.detectChanges();
    }
  };

  constructor(
    private _authService: AuthService,
    private sharedDataService: SharedDataService,
    private _crudService: CrudService,
    private cdRef: ChangeDetectorRef,
    private batchTermService: BatchTermService,
    private _router: Router,
    private sessionManagementService: SessionManagementService
  ) {}

  ngOnInit(): void {
    this.initializeUserData();
    this._authService.isAuthenticated().then(isAuth => {
      this.applyAuth(isAuth);
      if (isAuth) {
        this.getNextAcademicTerm();
      }
    }).catch(() => this.handleAuthFailure());

    this._authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe({
      next: user => this.applyAuth(!!user, user),
      error: () => this.handleAuthFailure()
    });

    this._authService.isAuthenticated$.pipe(takeUntil(this.destroy$)).subscribe(isAuth => {
      this.isUserAuthenticated = isAuth;
      if (isAuth) {
        this.initializeUserData();
      } else {
        this.resetUserData();
      }
      this.cdRef.detectChanges();
    });

    this._router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.initialLoadComplete = true;
      const shouldBeLoggedIn = localStorage.getItem('isLogin') === 'true';
      if (this.isLogin !== shouldBeLoggedIn) {
        this.isLogin = shouldBeLoggedIn;
        if (shouldBeLoggedIn) {
          this.initializeUserData();
        }
      }
      this.checkIfAuthRoute();
      this.redirectApplicantToAdmissionRequest();
      this.cdRef.detectChanges();
    });

    this.sharedDataService.share.pipe(takeUntil(this.destroy$)).subscribe((data: any) => {
      if (data?.type !== 'LOGIN_SUCCESS') {
        return;
      }
      this.isCollapsed = false;
      this.persistLoginUser(data.user);
      this.initializeUserData();
      this.redirectApplicantToAdmissionRequest();
      this.cdRef.detectChanges();
    });

    window.addEventListener('storage', this.storageListener);
    this.checkIfAuthRoute();
  }

  ngAfterViewInit(): void {
    this.cdRef.detectChanges();
  }

  ngOnDestroy(): void {
    window.removeEventListener('storage', this.storageListener);
    this.destroy$.next();
    this.destroy$.complete();
    this.sessionManagementService.destroy();
  }

  login = () => {
    this._router.navigate(['/accounts/login']);
  };

  logout = () => {
    this.resetUserData();
    this._authService.logout();
  };

  goToHome = () => {
    this._router.navigate(['/portal']);
  };

  goToProgram = () => {
    this._router.navigate(['/acadamic-programme']);
  };

  changePassword = () => {
    this._router.navigate(['/accounts/change-password']);
  };

  goToProfile = () => {
    const userId = this.currentUser?.id || this.storedUserId();
    this._router.navigate(userId ? ['/user-management/user', userId] : ['/user-management/users']);
  };

  get currentUrl(): string {
    return this._router.url;
  }

  private applyAuth(isAuth: boolean, user: any = this._authService.getCurrentUser()): void {
    this.isUserAuthenticated = isAuth;
    this.currentUser = user;
    this.isUserAdmin = this._authService.hasRole('Administrator') || this._authService.hasRole('Admin');
    this.initializeUserData();
    this.cdRef.detectChanges();
  }

  private persistLoginUser(user: any): void {
    if (!user) {
      return;
    }
    if (user.id) {
      localStorage.setItem('userId', user.id);
      localStorage.setItem('user_id', user.id);
    }
    if (user.firstName) {
      localStorage.setItem('firstName', user.firstName);
    }
    if (user.lastName) {
      localStorage.setItem('lastName', user.lastName);
    }
    if (user.email) {
      localStorage.setItem('email', user.email);
    }
    if (!user.role) {
      return;
    }
    if (Array.isArray(user.role)) {
      localStorage.setItem('role', JSON.stringify(user.role));
      localStorage.setItem('userType', user.role[0] || '');
      return;
    }
    localStorage.setItem('role', user.role);
    localStorage.setItem('userType', user.role);
  }

  private checkIfAuthRoute(): void {
    const currentUrl = this._router.url;
    this.isAuthRoute = this.authRoutes.some(route => currentUrl.includes(route));
    this.isPortalRoute = currentUrl.includes('/portal');
  }

  private getNextAcademicTerm(): void {
    if (localStorage.getItem('isLogin') !== 'true' || !this._authService.getToken()) {
      return;
    }
    this.batchTermService.getNextAcademicTerm().subscribe({
      next: (res: any) => sessionStorage.setItem('nextAcademicTerm', JSON.stringify(res)),
      error: () => {}
    });
  }

  private initializeUserData(): void {
    try {
      if (localStorage.getItem('isLogin') !== 'true') {
        this.resetUserData();
        return;
      }
      this.isLogin = true;
      this.isCollapsed = false;
      const firstName = localStorage.getItem('firstName');
      const lastName = localStorage.getItem('lastName');
      const userType = localStorage.getItem('userType');
      const role = localStorage.getItem('role');
      this.userEmail = localStorage.getItem('email');
      this.shortUserName = [firstName, lastName].filter(Boolean).join(' ') || this.userEmail || 'Welcome';
      this.userType = userType || this.firstRole(role) || '';
      if (this.userType) {
        this.setUserRole(this.userType);
      } else if (role) {
        this.setUserRole(this.firstRole(role) || role);
      }
      if (this.isApplicant(userType, role)) {
        this.redirectApplicantToAdmissionRequest();
      }
      if (this.isReviewer(userType, role)) {
        setTimeout(() => this.redirectReviewerToApplicantRequestList(), 100);
      }
    } catch {
      this.resetUserData();
    }
  }

  private setUserRole(role: string): void {
    const cleanRole = role.replace(/"/g, '').trim();
    this.isUserAdmin = false;
    this.isUserInstructor = false;
    this.isUserStudent = false;
    this.isUserReviewer = false;
    this.isUserApplicant = false;
    this.isUserApprovedApplicant = false;
    this.isUserFinance = false;
    this.isUserReception = false;
    this.isUserAcademicDirector = false;
    this.isUserSectionReportViewer = false;
    this.isUserDepartmentHead = false;
    switch (cleanRole) {
      case 'Super Admin':
      case 'Admin':
      case 'Administrator':
        this.isUserAdmin = true;
        break;
      case 'Instructor':
        this.isUserInstructor = true;
        break;
      case 'Student':
        this.isUserStudent = true;
        break;
      case 'Reviewer':
        this.isUserReviewer = true;
        break;
      case 'Applicant':
        this.checkApplicantStatus();
        this.isUserApplicant = true;
        this.redirectApplicantToAdmissionRequest();
        break;
      case 'ApprovedApplicant':
        this.isUserApprovedApplicant = true;
        this.userType = 'Student';
        return;
      case 'Finance':
        this.isUserFinance = true;
        break;
      case 'Reception':
        this.isUserReception = true;
        break;
      case 'Academic Director':
        this.isUserAcademicDirector = true;
        break;
      case 'Section Report Viewer':
        this.isUserSectionReportViewer = true;
        break;
      case 'Department Head':
        this.isUserDepartmentHead = true;
        break;
      default:
        return;
    }
    this.userType = cleanRole;
  }

  private resetUserData(): void {
    this.isLogin = false;
    this.shortUserName = 'Welcome';
    this.userType = '';
    this.userEmail = null;
    this.currentUser = null;
    this.isUserAdmin = false;
    this.isUserInstructor = false;
    this.isUserStudent = false;
    this.isUserApplicant = false;
    this.isUserReviewer = false;
    this.isUserApprovedApplicant = false;
    this.isUserAlreadyApplied = false;
    this.isUserFinance = false;
    this.isUserReception = false;
    this.isUserAcademicDirector = false;
    this.isUserSectionReportViewer = false;
    this.isUserDepartmentHead = false;
    this.isUserAuthenticated = false;
  }

  private checkApplicantStatus(): void {
    const userId = this.storedUserId();
    if (!userId) {
      return;
    }
    this._crudService.getList('/Applicants/ByApplicantUserId/' + userId).subscribe({
      next: (res: any) => {
        this.isUserAlreadyApplied = !!res.data;
        this.isUserApplicant = !res.data;
        this.cdRef.detectChanges();
      },
      error: () => {
        this.isUserApplicant = true;
        this.cdRef.detectChanges();
      }
    });
  }

  private redirectApplicantToAdmissionRequest(): void {
    if (!this.isUserApplicant && this.userType !== 'Applicant') {
      return;
    }
    const currentUrl = this._router.url;
    if (
      currentUrl.includes('/student-application') ||
      currentUrl.includes('/accounts') ||
      currentUrl.includes('/portal')
    ) {
      return;
    }
    this._router.navigate(['/student-application/admission-request']);
  }

  private redirectReviewerToApplicantRequestList(): void {
    if (this.redirectInProgress || !this.initialLoadComplete) {
      return;
    }
    const currentUrl = this._router.url;
    if (this.reviewerRoutes.some(route => currentUrl.includes(route))) {
      return;
    }
    const isOnRootOrOtherPage = currentUrl === '/'
      || currentUrl === '/student-application'
      || (!currentUrl.includes('/student-application/') && !currentUrl.includes('/accounts') && !currentUrl.includes('/portal'));
    if (!isOnRootOrOtherPage) {
      return;
    }
    this.redirectInProgress = true;
    this._router.navigate(['/student-application/applicant-request-list']).then(() => {
      this.redirectInProgress = false;
    });
  }

  private handleAuthFailure(): void {
    this.initializeUserData();
    this.cdRef.detectChanges();
  }

  private storedUserId(): string | null {
    return localStorage.getItem('userId') || localStorage.getItem('user_id');
  }

  private firstRole(role: string | null): string {
    if (!role) {
      return '';
    }
    try {
      const roles = JSON.parse(role);
      return Array.isArray(roles) ? (roles[0] || '') : role;
    } catch {
      return role;
    }
  }

  private isApplicant(userType: string | null, role: string | null): boolean {
    return this.isUserApplicant || userType === 'Applicant' || role === 'Applicant';
  }

  private isReviewer(userType: string | null, role: string | null): boolean {
    return this.isUserReviewer || userType === 'Reviewer' || role === 'Reviewer';
  }
}
