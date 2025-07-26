import { Injectable } from '@angular/core';
import { Subject, Observable, throwError, BehaviorSubject } from 'rxjs';
import { SharedDataService } from './shared-data.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, tap, timeout, retry } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { 
  LoginRequest, 
  RegisterRequest, 
  OtpVerifyRequest, 
  ResetPasswordRequest,
  User,
  AuthenticationInfo
} from './auth.interface';
import { MobileDetectionService } from './mobile-detection.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
   private baseUrl = environment.secureUrl;
  private _loginChangedSubject = new Subject<boolean>();
  private _currentUserSubject = new BehaviorSubject<User | null>(null);

  authorizationInfo!: any;

  public loginChanged = this._loginChangedSubject.asObservable();
  public currentUser$ = this._currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private mobileDetectionService: MobileDetectionService
  ) {
    // Browser close detection is disabled to prevent issues with page duplication
    // and navigation. Users will be logged out due to inactivity or session timeout instead.
  }

  public login = () => {
    window.location.href = '/accounts/login';
  };

  public loginWithCredentials(loginRequest: LoginRequest): Observable<any> {
    // Adjust timeout based on device type
    const timeoutValue = this.mobileDetectionService.isMobileDevice() ? 45000 : 30000;
    const retryCount = this.mobileDetectionService.isSlowConnection() ? 3 : 2;
    
    return this.http.post(`${this.baseUrl}/authentication/login`, loginRequest)
      .pipe(
        timeout(timeoutValue), // Longer timeout for mobile
        retry(retryCount), // More retries for slow connections
        catchError(this.handleError)
      );
  }

  public isAuthenticated = (): Promise<boolean> => {
    const isLoggedIn = localStorage.getItem('isLogin') === 'true';
    const hasToken = localStorage.getItem('access_token');
    
    if (isLoggedIn && hasToken) {
      const user = this.getCurrentUser();
      this._currentUserSubject.next(user);
      this._loginChangedSubject.next(true);
      return Promise.resolve(true);
    } else {
      this._currentUserSubject.next(null);
      this._loginChangedSubject.next(false);
      return Promise.resolve(false);
    }
  };

  public finishLogin = (): Promise<any> => {
    return Promise.resolve(this.getCurrentUser());
  };

  public logout = () => {
    localStorage.clear();
    sessionStorage.clear();
    this._currentUserSubject.next(null);
    this._loginChangedSubject.next(false);
    window.location.href = '/accounts/login';
  };

  public finishLogout = () => {
    this._currentUserSubject.next(null);
    this._loginChangedSubject.next(false);
    return Promise.resolve();
  };

  public getAccessToken = (): Promise<string> => {
    const token = localStorage.getItem('access_token');
    return Promise.resolve(token || '');
  };

  public getToken(): string | null {
    return localStorage.getItem('access_token');
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
      isLogin: isLogin,
      _user: user,
    });
    return auth;
  }

  register(userRegistration: RegisterRequest): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/authentication/register`, userRegistration)
      .pipe(
        catchError(this.handleError)
      );
  }

  public verifyOtp(email: string, otp: string): Observable<any> {
    const request: OtpVerifyRequest = { email, otp };
    return this.http.post(`${this.baseUrl}/authentication/verify-otp`, request)
      .pipe(
        catchError(this.handleError)
      );
  }

  public resetPassword(email: string, token: string, newPassword: string, confirmPassword: string): Observable<any> {
    const request: ResetPasswordRequest = { email, token, newPassword, confirmPassword };
    return this.http.post(`${this.baseUrl}/authentication/reset-password`, request)
      .pipe(
        catchError(this.handleError)
      );
  }

  public changePassword(currentPassword: string, newPassword: string, confirmPassword: string): Observable<any> {
    const request = { 
      currentPassword, 
      newPassword, 
      confirmPassword 
    };
    return this.http.post(`${this.baseUrl}/authentication/change-password`, request)
      .pipe(
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
    const url = `${this.baseUrl}/authentication/verify-email?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
    return this.http.get(url)
      .pipe(
        tap(response => console.log('AuthService: GET request successful:', response)),
        catchError(error => {
          return this.handleError(error);
        })
      );
  }

  public resendVerificationEmail(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/authentication/resend-verification`, { email })
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

  public getCurrentUser(): any {
    const user = {
      id: localStorage.getItem('userId'),
      firstName: localStorage.getItem('firstName'),
      lastName: localStorage.getItem('lastName'),
      email: localStorage.getItem('email'),
      role: localStorage.getItem('role'),
      userType: localStorage.getItem('userType')
    };
    return user;
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
    const request = {
      accessToken: accessToken,
      refreshToken: refreshToken
    };
    return this.http.post(`${this.baseUrl}/authentication/refresh-token`, request)
      .pipe(
        catchError(this.handleError)
      );
  }

  public saveTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  public getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  public clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  private handleBrowserClose(): void {
    this.clearTokens();
    this._currentUserSubject.next(null);
    this._loginChangedSubject.next(false);
    localStorage.removeItem('isLogin');
    localStorage.removeItem('userId');
    localStorage.removeItem('firstName');
    localStorage.removeItem('lastName');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
    localStorage.removeItem('userType');
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    
    // Log device information for debugging
    const deviceInfo = this.mobileDetectionService.getDeviceInfo();
    console.log('Device Info:', deviceInfo);
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
      
      // Handle mobile-specific client errors
      if (this.mobileDetectionService.isMobileDevice()) {
        if (error.error.message.includes('Failed to fetch')) {
          errorMessage = 'Network connection failed. Please check your internet connection and try again.';
        } else if (error.error.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again with a better connection.';
        }
      }
    } else {
      // Server-side error
      if (error.status === 0) {
        errorMessage = this.mobileDetectionService.isMobileDevice() 
          ? 'Network error: Unable to connect to the server. Please check your mobile data or WiFi connection.'
          : 'Network error: Unable to connect to the server. Please check your internet connection.';
      } else if (error.status === 404) {
        errorMessage = 'API endpoint not found. Please contact support.';
      } else if (error.status === 401) {
        errorMessage = 'Authentication failed. Please check your credentials.';
      } else if (error.status === 403) {
        errorMessage = 'Access denied. You do not have permission to perform this action.';
      } else if (error.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.status === 504) {
        errorMessage = this.mobileDetectionService.isMobileDevice()
          ? 'Gateway timeout: The server is taking too long to respond. Please try again with a better connection.'
          : 'Gateway timeout: The server is taking too long to respond. Please try again in a few moments.';
      } else if (error.status === 503) {
        errorMessage = 'Service unavailable: The server is temporarily unavailable. Please try again later.';
      } else {
        errorMessage = `Server Error: ${error.status} - ${error.message}`;
      }
    }
    
    // Log detailed error information for debugging
    console.error('Auth Service Error:', {
      error: error,
      deviceInfo: deviceInfo,
      url: error.url,
      status: error.status,
      statusText: error.statusText
    });
    
    return throwError(() => new Error(errorMessage));
  }
}
