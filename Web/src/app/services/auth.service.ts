import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, throwError } from 'rxjs';
import { catchError, timeout, retry, shareReplay } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { LoginRequest, RegisterRequest, User, AuthenticationInfo } from './auth.interface';
import { MobileDetectionService } from './mobile-detection.service';
import { TokenStorageService } from './token-storage.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = environment.secureUrl;
  private _loginChangedSubject = new Subject<boolean>();
  private _currentUserSubject = new BehaviorSubject<User | null>(null);
  private _isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  
  authorizationInfo!: any;
  
  public loginChanged = this._loginChangedSubject.asObservable();
  public currentUser$ = this._currentUserSubject.asObservable();
  public isAuthenticated$ = this._isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private mobileDetectionService: MobileDetectionService,
    private tokenStorageService: TokenStorageService
  ) {
    // Initialize authentication state
    this.initializeAuthState();
  }

  private initializeAuthState(): void {
    const isLogin = localStorage.getItem('isLogin') === 'true';
    const hasToken = localStorage.getItem('access_token');
    
    if (isLogin && hasToken) {
      const user = this.getCurrentUser();
      this._currentUserSubject.next(user);
      this._isAuthenticatedSubject.next(true);
      this._loginChangedSubject.next(true);
    } else {
      this._currentUserSubject.next(null);
      this._isAuthenticatedSubject.next(false);
      this._loginChangedSubject.next(false);
    }
  }

  public login = () => {
    window.location.href = '/accounts/login';
  };

  public loginWithCredentials(loginRequest: LoginRequest): Observable<any> {
    // Adjust timeout based on device type and environment
    const timeoutValue = this.mobileDetectionService.isMobileDevice() ? 60000 : 45000; // Increased timeout for production
    const retryCount = this.mobileDetectionService.isSlowConnection() ? 3 : 2;
    
    console.log('Making login request to:', `${this.baseUrl}/authentication/login`);
    console.log('Environment:', environment.production ? 'Production' : 'Development');
    
    return this.http.post(`${this.baseUrl}/authentication/login`, loginRequest)
      .pipe(
        timeout(timeoutValue), // Longer timeout for production
        retry(retryCount), // More retries for slow connections
        catchError(this.handleError),
        shareReplay(1) // Share the result with multiple subscribers
      );
  }

  public isAuthenticated = (): Promise<boolean> => {
    const isLogin = localStorage.getItem('isLogin') === 'true';
    const hasToken = localStorage.getItem('access_token');
    const tokenStorageIsLogin = this.tokenStorageService.getIsLogin();
    
    // Check both localStorage and token storage service
    const isAuth = isLogin && hasToken && tokenStorageIsLogin;
    
    // Update the subject
    this._isAuthenticatedSubject.next(isAuth);
    
    return Promise.resolve(isAuth);
  };

  public finishLogin = (): Promise<any> => {
    return Promise.resolve(this.getCurrentUser());
  };

  public logout = () => {
    this.tokenStorageService.signOut();
    this._currentUserSubject.next(null);
    this._isAuthenticatedSubject.next(false);
    this._loginChangedSubject.next(false);
    
    // Clear all auth data
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
    
    window.location.href = '/accounts/login';
  };

  public finishLogout = () => {
    this._currentUserSubject.next(null);
    this._isAuthenticatedSubject.next(false);
    this._loginChangedSubject.next(false);
    return Promise.resolve();
  };

  public getAccessToken = (): Promise<string> => {
    const token = this.tokenStorageService.getToken();
    return Promise.resolve(token || '');
  };

  public getToken(): string | null {
    return this.tokenStorageService.getToken() || localStorage.getItem('access_token');
  }

  public checkIfUserIsAdmin = (): Promise<boolean> => {
    const userRole = localStorage.getItem('role');
    const userType = localStorage.getItem('userType');
    const isAdmin = userRole === 'Super Admin' || 
                   userRole === 'Administrator' || 
                   userRole === 'Admin' ||
                   userType === 'Super Admin' ||
                   userType === 'Administrator' ||
                   userType === 'Admin';
    
    return Promise.resolve(isAdmin);
  };

  public hasRole(role: string): boolean {
    const userRole = localStorage.getItem('role');
    const userType = localStorage.getItem('userType');
    if (userRole) {
      try {
        const roles = JSON.parse(userRole);
        const result = Array.isArray(roles) ? roles.includes(role) : roles === role;
        return result;
      } catch {
        const result = userRole === role;
        return result;
      }
    }
    const result = userType === role;
    return result;
  }

  getAuthenticationInfo(isLogin: boolean, user: User): AuthenticationInfo {
    const auth: AuthenticationInfo = (this.authorizationInfo = {
      isLogin,
      _user: user,
      user,
      roles: user?.roles || [],
      permissions: user?.permissions || []
    });
    return auth;
  }

  register(userRegistration: RegisterRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/authentication/register`, userRegistration)
      .pipe(
        timeout(60000), // Add 60-second timeout for registration
        retry(1), // Add retry mechanism
        catchError(this.handleError)
      );
  }

  public verifyOtp(email: string, otp: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/authentication/verify-otp`, { email, otp })
      .pipe(
        catchError(this.handleError),
        shareReplay(1)
      );
  }

  public resetPassword(email: string, token: string, newPassword: string, confirmPassword: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/authentication/reset-password`, {
      email,
      token,
      newPassword,
      confirmPassword
    }).pipe(
      catchError(this.handleError)
    );
  }

  public changePassword(currentPassword: string, newPassword: string, confirmPassword: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/authentication/change-password`, {
      currentPassword,
      newPassword,
      confirmPassword
    }).pipe(
      catchError(this.handleError)
    );
  }

  public verifyEmail(email: string, token: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/authentication/verify-email`, { email, token })
      .pipe(
        catchError(this.handleError)
      );
  }

  public verifyEmailGet(email: string, token: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/authentication/verify-email?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`)
      .pipe(
        catchError((error) => {
          console.error('GET verification failed, trying POST method', error);
          // Fallback to POST method if GET fails
          return this.verifyEmail(email, token);
        })
      );
  }

  public resendVerificationEmail(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/authentication/resend-verification-email`, { email })
      .pipe(
        catchError(this.handleError)
      );
  }

  public resendOtp(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/authentication/resend-otp`, { email })
      .pipe(
        catchError(this.handleError)
      );
  }

  public updateCurrentUser(user: User | null): void {
    this._currentUserSubject.next(user);
  }

  public updateLoginState(isLoggedIn: boolean): void {
    this._loginChangedSubject.next(isLoggedIn);
    this._isAuthenticatedSubject.next(isLoggedIn);
  }

  public getCurrentUser(): any {
    const user: User = {
      id: localStorage.getItem('userId') || '',
      email: localStorage.getItem('email') || '',
      firstName: localStorage.getItem('firstName') || '',
      lastName: localStorage.getItem('lastName') || '',
      role: localStorage.getItem('role') || '',
      userType: localStorage.getItem('userType') || '',
      roles: this.parseRoles(localStorage.getItem('role')),
      permissions: []
    };

    return user;
  }

  private parseRoles(rolesString: string | null): string[] {
    if (!rolesString) return [];
    try {
      const roles = JSON.parse(rolesString);
      return Array.isArray(roles) ? roles : [roles];
    } catch {
      return [rolesString];
    }
  }

  public forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/authentication/forgot-password`, { email })
      .pipe(
        catchError(this.handleError)
      );
  }

  public extendSession(): Observable<any> {
    return this.http.post(`${this.baseUrl}/authentication/extend-session`, {})
      .pipe(
        catchError(this.handleError)
      );
  }

  public refreshToken(accessToken: string, refreshToken: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/authentication/refresh-token`, {
      accessToken,
      refreshToken
    }).pipe(
      catchError(this.handleError)
    );
  }

  public saveTokens(accessToken: string, refreshToken: string): void {
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.tokenStorageService.saveToken(accessToken, userId);
    }
  }

  public getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  public clearTokens(): void {
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.tokenStorageService.logoutUser(userId);
    }
  }

  // Multi-user support methods
  public switchToUser(userId: string): boolean {
    return this.tokenStorageService.switchToUser(userId);
  }

  public getLoggedInUsers(): string[] {
    return this.tokenStorageService.getLoggedInUsers();
  }

  public logoutUser(userId: string): void {
    this.tokenStorageService.logoutUser(userId);
  }

  private handleBrowserClose(): void {
    // Clear sensitive data when browser is closed
    sessionStorage.clear();
    // Note: localStorage persists across browser sessions
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    
    console.error('HTTP Error Details:', {
      status: error.status,
      statusText: error.statusText,
      url: error.url,
      error: error.error,
      message: error.message
    });
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
      console.error('Client-side error:', errorMessage);
    } else {
      // Server-side error
      if (error.status === 0) {
        errorMessage = 'Network error: Unable to connect to the server. Please check your internet connection and try again.';
      } else if (error.status === 400) {
        errorMessage = error.error?.message || 'Bad request. Please check your verification link and try again.';
      } else if (error.status === 401) {
        errorMessage = 'Authentication failed. Please check your credentials or verification link.';
      } else if (error.status === 403) {
        errorMessage = 'Access denied. You do not have permission to access this resource.';
      } else if (error.status === 404) {
        errorMessage = 'Service not found. Please contact support.';
      } else if (error.status === 422) {
        errorMessage = error.error?.message || 'Invalid verification data. Please check your email and token.';
      } else if (error.status === 500) {
        errorMessage = 'Server error. Please try again later or contact support.';
      } else if (error.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else {
        errorMessage = error.error?.message || error.message || 'Server error';
      }
      console.error('Server-side error:', errorMessage);
    }
    
    return throwError(() => new Error(errorMessage));
  }
}
