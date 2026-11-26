import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, throwError } from 'rxjs';
import { catchError, timeout, retry, shareReplay } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { LoginRequest, RegisterRequest, User, AuthenticationInfo } from './auth.interface';
import { MobileDetectionService } from './mobile-detection.service';
import { TokenStorageService } from './token-storage.service';
import { SecureTokenStorageService } from './secure-token-storage.service';
import { CrudService } from './crud.service';
import { SESSION_CONSTANTS } from './session-management.constants';
import { isJwtExpired } from '../constants';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _loginChangedSubject = new Subject<boolean>();
  private _currentUserSubject = new BehaviorSubject<User | null>(null);
  private _isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

  authorizationInfo!: any;

  public loginChanged = this._loginChangedSubject.asObservable();
  public currentUser$ = this._currentUserSubject.asObservable();
  public isAuthenticated$ = this._isAuthenticatedSubject.asObservable();

  private readonly authKeys = SESSION_CONSTANTS.AUTH_KEYS;

  constructor(
    private crud: CrudService,
    private mobileDetectionService: MobileDetectionService,
    private tokenStorageService: TokenStorageService,
    private secureTokenStorage: SecureTokenStorageService
  ) {
    this.initializeAuthState();
    setTimeout(() => {
      try {
        this.secureTokenStorage.migrateFromLocalStorage();
      } catch {
      }
    }, 2000);
  }

  private initializeAuthState(): void {
    const isLogin = localStorage.getItem('isLogin') === 'true';
    const hasToken = this.getToken();
    this.setAuthState(!!(isLogin && hasToken));
  }

  public login = () => {
    window.location.href = '/accounts/login';
  };

  public loginWithCredentials(loginRequest: LoginRequest): Observable<any> {
    const timeoutValue = this.mobileDetectionService.isMobileDevice() ? 60000 : 45000;
    const retryCount = this.mobileDetectionService.isSlowConnection() ? 3 : 2;
    return this.crud.secure.post('/authentication/login', loginRequest).pipe(
      timeout(timeoutValue),
      retry(retryCount),
      catchError(this.handleError),
      shareReplay(1)
    );
  }

  public isAuthenticated = (): Promise<boolean> => {
    const isAuth = localStorage.getItem('isLogin') === 'true'
      && !!this.getToken()
      && this.tokenStorageService.getIsLogin();
    this._isAuthenticatedSubject.next(isAuth);
    return Promise.resolve(isAuth);
  };

  public finishLogin = (): Promise<any> => {
    return Promise.resolve(this.getCurrentUser());
  };

  public logout = () => {
    this.tokenStorageService.signOut();
    this.setAuthState(false);
    this.secureTokenStorage.clearTokens();
    this.authKeys.forEach(key => localStorage.removeItem(key));
    window.location.href = '/accounts/login';
  };

  public finishLogout = () => {
    this.setAuthState(false);
    return Promise.resolve();
  };

  public getAccessToken = (): Promise<string> => {
    return Promise.resolve(this.getToken() || '');
  };

  public getToken(): string | null {
    const token = this.secureTokenStorage.getAccessToken()
      || this.tokenStorageService.getToken()
      || localStorage.getItem('access_token');
    if (!token || isJwtExpired(token)) {
      return null;
    }
    return token;
  }

  public checkIfUserIsAdmin = (): Promise<boolean> => {
    return Promise.resolve(
      this.hasRole('Super Admin') || this.hasRole('Administrator') || this.hasRole('Admin')
    );
  };

  public hasRole(role: string): boolean {
    const userRole = localStorage.getItem('role');
    const userType = localStorage.getItem('userType');
    if (userRole) {
      try {
        const roles = JSON.parse(userRole);
        return Array.isArray(roles) ? roles.includes(role) : roles === role;
      } catch {
        return userRole === role;
      }
    }
    return userType === role;
  }

  getAuthenticationInfo(isLogin: boolean, user: User): AuthenticationInfo {
    return this.authorizationInfo = {
      isLogin,
      _user: user,
      user,
      roles: user?.roles || [],
      permissions: user?.permissions || []
    };
  }

  register(userRegistration: RegisterRequest): Observable<any> {
    return this.crud.secure.post('/authentication/register', userRegistration, undefined, this.clientHeaders()).pipe(
      timeout(60000),
      retry(1),
      catchError(this.handleError)
    );
  }

  public sendGradeActionOtp(purpose: string): Observable<any> {
    return this.crud.secure.post('/authentication/grade-action-otp/send', { purpose }).pipe(
      catchError(this.handleError)
    );
  }

  public verifyGradeActionOtp(purpose: string, otp: string): Observable<any> {
    return this.crud.secure.post('/authentication/grade-action-otp/verify', { purpose, otp }).pipe(
      catchError(this.handleError)
    );
  }

  public verifyOtp(email: string, otp: string): Observable<any> {
    return this.crud.secure.post('/authentication/verify-otp', { email, otp }).pipe(
      catchError(this.handleError),
      shareReplay(1)
    );
  }

  public resetPassword(email: string, token: string, newPassword: string, confirmPassword: string): Observable<any> {
    return this.crud.secure.post('/authentication/reset-password', {
      email,
      token,
      newPassword,
      confirmPassword
    }).pipe(catchError(this.handleError));
  }

  public changePassword(currentPassword: string, newPassword: string, confirmPassword: string): Observable<any> {
    return this.crud.secure.post('/authentication/change-password', {
      currentPassword,
      newPassword,
      confirmPassword
    }).pipe(catchError(this.handleError));
  }

  public verifyEmail(email: string, token: string): Observable<any> {
    return this.crud.secure.post('/authentication/verify-email', { email, token }, undefined, this.clientHeaders())
      .pipe(catchError(this.handleError));
  }

  public verifyEmailGet(email: string, token: string): Observable<any> {
    return this.crud.secure.get('/authentication/verify-email', { email, token }, this.clientHeaders()).pipe(
      catchError(() => this.verifyEmail(email, token))
    );
  }

  public resendVerificationEmail(email: string): Observable<any> {
    return this.crud.secure.post('/authentication/resend-verification-email', { email })
      .pipe(catchError(this.handleError));
  }

  public resendOtp(email: string): Observable<any> {
    return this.crud.secure.post('/authentication/resend-otp', { email })
      .pipe(catchError(this.handleError));
  }

  public updateCurrentUser(user: User | null): void {
    this._currentUserSubject.next(user);
  }

  public updateLoginState(isLoggedIn: boolean): void {
    this._loginChangedSubject.next(isLoggedIn);
    this._isAuthenticatedSubject.next(isLoggedIn);
  }

  public getCurrentUser(): any {
    return {
      id: localStorage.getItem('userId') || '',
      email: localStorage.getItem('email') || '',
      firstName: localStorage.getItem('firstName') || '',
      lastName: localStorage.getItem('lastName') || '',
      role: localStorage.getItem('role') || '',
      userType: localStorage.getItem('userType') || '',
      roles: this.parseRoles(localStorage.getItem('role')),
      permissions: []
    };
  }

  public forgotPassword(email: string): Observable<any> {
    return this.crud.secure.post('/authentication/forgot-password', { email })
      .pipe(catchError(this.handleError));
  }

  public extendSession(): Observable<any> {
    return this.crud.secure.post('/authentication/extend-session', {})
      .pipe(catchError(this.handleError));
  }

  public refreshToken(accessToken: string, refreshToken: string): Observable<any> {
    return this.crud.secure.post('/authentication/refresh-token', { accessToken, refreshToken })
      .pipe(catchError(this.handleError));
  }

  public saveTokens(accessToken: string, refreshToken: string): void {
    this.setAccessToken(accessToken);
    this.setRefreshToken(refreshToken);
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.tokenStorageService.saveToken(accessToken, userId);
    }
  }

  public getRefreshToken(): string | null {
    return this.secureTokenStorage.getRefreshToken() || localStorage.getItem('refresh_token');
  }

  public setAccessToken(token: string): boolean {
    const stored = this.secureTokenStorage.setAccessToken(token);
    if (token) {
      try {
        localStorage.setItem('access_token', token);
      } catch {
      }
    }
    return stored;
  }

  public setRefreshToken(token: string): boolean {
    const stored = this.secureTokenStorage.setRefreshToken(token);
    if (token) {
      try {
        localStorage.setItem('refresh_token', token);
      } catch {
      }
    }
    return stored;
  }

  public clearTokens(): void {
    this.secureTokenStorage.clearTokens();
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.tokenStorageService.logoutUser(userId);
    }
  }

  public switchToUser(userId: string): boolean {
    return this.tokenStorageService.switchToUser(userId);
  }

  public getLoggedInUsers(): string[] {
    return this.tokenStorageService.getLoggedInUsers();
  }

  public logoutUser(userId: string): void {
    this.tokenStorageService.logoutUser(userId);
  }

  private setAuthState(isLoggedIn: boolean): void {
    this._currentUserSubject.next(isLoggedIn ? this.getCurrentUser() : null);
    this._isAuthenticatedSubject.next(isLoggedIn);
    this._loginChangedSubject.next(isLoggedIn);
  }

  private parseRoles(rolesString: string | null): string[] {
    if (!rolesString) {
      return [];
    }
    try {
      const roles = JSON.parse(rolesString);
      return Array.isArray(roles) ? roles : [roles];
    } catch {
      return [rolesString];
    }
  }

  private clientHeaders(): Record<string, string> {
    return { 'X-Client-App': environment.frontendClientKey };
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else if (error.status === 0) {
      errorMessage = 'Network error: Unable to connect to the server. Please check your internet connection and try again.';
    } else if (error.status === 400) {
      errorMessage = error.error?.message || 'Bad request. Please check your verification link and try again.';
    } else if (error.status === 401) {
      errorMessage = error.error?.message || 'Authentication failed. Please check your credentials.';
    } else if (error.status === 403) {
      errorMessage = 'Access denied. You do not have permission to access this resource.';
    } else if (error.status === 404) {
      errorMessage = 'Service not found. Please contact support.';
    } else if (error.status === 422) {
      errorMessage = error.error?.message || 'Invalid verification data. Please check your email and token.';
    } else if (error.status >= 500) {
      errorMessage = error.status === 500
        ? 'Server error. Please try again later or contact support.'
        : 'Server error. Please try again later.';
    } else {
      errorMessage = error.error?.message || error.message || 'Server error';
    }
    const customError = new Error(errorMessage);
    (customError as any).originalError = error;
    (customError as any).error = error.error;
    return throwError(() => customError);
  }
}
