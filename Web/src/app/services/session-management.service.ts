import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { BehaviorSubject, fromEvent, merge } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  SessionConfig,
  SessionState,
  SessionInfo,
  SessionData,
  LogoutBeaconData,
  ISessionManagementService
} from './session-management.interface';
import { SESSION_CONSTANTS } from './session-management.constants';

@Injectable({
  providedIn: 'root'
})
export class SessionManagementService implements ISessionManagementService {
  private sessionConfig: SessionConfig = SESSION_CONSTANTS.DEFAULT_CONFIG;

  private inactivityTimer: any;
  private sessionTimer: any;
  private warningTimer: any;
  private lastActivityTime: Date = new Date();
  private sessionStartTime: Date = new Date();
  private isSessionActive = false;
  private destroy$ = new BehaviorSubject<boolean>(false);

  private sessionStateSubject = new BehaviorSubject<SessionState>({
    isActive: false,
    timeRemaining: 0,
    isWarning: false
  });

  public sessionState$ = this.sessionStateSubject.asObservable();

  constructor(
    private authService: AuthService,
    private router: Router,
    private ngZone: NgZone
  ) {
    this.loadSessionConfig();
    this.initializeSessionManagement();
  }

  private loadSessionConfig(): void {
    const savedConfig = localStorage.getItem(SESSION_CONSTANTS.STORAGE_KEYS.SESSION_CONFIG);
    if (savedConfig) {
      try {
        this.sessionConfig = { ...this.sessionConfig, ...JSON.parse(savedConfig) };
      } catch (error) {
      }
    }
  }

  private initializeSessionManagement(): void {
    this.authService.isAuthenticated().then(isAuthenticated => {
      if (isAuthenticated) {
        this.startSession();
      }
    });
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.startSession();
      } else {
        this.stopSession();
      }
    });
    if (this.sessionConfig.enableActivityTracking) {
      this.setupActivityTracking();
    }
    if (this.sessionConfig.enableTabSync) {
      this.setupTabSync();
    }
    if (this.sessionConfig.enableBrowserCloseDetection) {
      this.setupBrowserCloseDetection();
    }
  }

  private setupActivityTracking(): void {
    const eventStreams = SESSION_CONSTANTS.ACTIVITY_EVENTS.map(event => fromEvent(document, event));

    merge(...eventStreams)
      .pipe(
        debounceTime(SESSION_CONSTANTS.TIMERS.ACTIVITY_DEBOUNCE_MS),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.updateActivity();
      });
  }

  private setupTabSync(): void {
    window.addEventListener('storage', (event) => {
      if (event.key === SESSION_CONSTANTS.STORAGE_KEYS.SESSION_DATA) {
        try {
          const sessionData = JSON.parse(event.newValue || '{}');
          this.syncSessionData(sessionData);
        } catch (error) {
        }
      }
    });
    this.broadcastSessionData();
  }

  private setupBrowserCloseDetection(): void {
    window.addEventListener('beforeunload', (event) => {
      if (this.isSessionActive) {
      }
    });
    window.addEventListener('pagehide', (event) => {
      if (this.isSessionActive) {
        if (event.persisted === false) {
          setTimeout(() => {
            this.handleBrowserClose();
          }, 100);
        }
      }
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && this.isSessionActive) {
        this.handleTabHidden();
      } else if (document.visibilityState === 'visible' && this.isSessionActive) {
        this.handleTabVisible();
      }
    });
    window.addEventListener('storage', (event) => {
      if (event.key === SESSION_CONSTANTS.STORAGE_KEYS.BROWSER_CLOSING && event.newValue === 'true') {
        this.handleBrowserClose();
      }
    });
  }

  private updateActivity(): void {
    this.lastActivityTime = new Date();
    this.resetInactivityTimer();
    this.broadcastSessionData();
  }

  private resetInactivityTimer(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }

    this.inactivityTimer = setTimeout(() => {
      this.handleInactivityTimeout();
    }, this.sessionConfig.inactivityTimeoutMinutes * 60 * 1000);
  }

  private startSession(): void {
    this.isSessionActive = true;
    this.sessionStartTime = new Date();
    this.lastActivityTime = new Date();
    this.resetInactivityTimer();
    this.startSessionTimer();
    this.broadcastSessionData();
    this.updateSessionState();
  }

  private stopSession(): void {
    this.isSessionActive = false;
    this.clearTimers();
    this.clearSessionData();
    this.updateSessionState();
  }

  private startSessionTimer(): void {
    if (this.sessionTimer) {
      clearInterval(this.sessionTimer);
    }

    this.sessionTimer = setInterval(() => {
      this.checkSessionTimeout();
    }, 60000);
  }

  private checkSessionTimeout(): void {
    const sessionDuration = new Date().getTime() - this.sessionStartTime.getTime();
    const maxSessionDuration = this.sessionConfig.sessionTimeoutMinutes * 60 * 1000;

    if (sessionDuration >= maxSessionDuration) {
      this.handleSessionTimeout();
    } else {
      const timeRemaining = maxSessionDuration - sessionDuration;
      const warningTime = this.sessionConfig.warningTimeMinutes * 60 * 1000;
      if (timeRemaining <= warningTime && !this.warningTimer) {
        this.showSessionWarning(timeRemaining);
      }
    }
  }

  private handleInactivityTimeout(): void {
    this.showInactivityWarning();
  }

  private handleSessionTimeout(): void {
    this.logout('Session expired due to timeout');
  }

  private showInactivityWarning(): void {
    const warningMessage = `You have been inactive for ${this.sessionConfig.inactivityTimeoutMinutes} minutes. You will be logged out in ${this.sessionConfig.warningTimeMinutes} minutes.`;
    if (confirm(warningMessage + '\n\nClick OK to stay logged in or Cancel to logout now.')) {
      this.updateActivity();
    } else {
      this.logout('Logged out due to inactivity');
    }
  }

  private showSessionWarning(timeRemaining: number): void {
    const minutes = Math.floor(timeRemaining / 60000);
    const warningMessage = `Your session will expire in ${minutes} minutes. Do you want to extend your session?`;
    if (confirm(warningMessage)) {
      this.extendSession();
    } else {
      this.logout('Session expired');
    }
  }

  private extendSession(): void {
    this.authService.extendSession().subscribe({
      next: (response) => {
        this.sessionStartTime = new Date();
        this.updateActivity();
        this.clearWarningTimer();
      },
      error: (error) => {
        this.logout('Failed to extend session');
      }
    });
  }

  private clearWarningTimer(): void {
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
  }

  private logout(reason: string): void {
    this.stopSession();
    this.clearSessionData();
    localStorage.removeItem('isLogin');
    localStorage.removeItem('userId');
    localStorage.removeItem('firstName');
    localStorage.removeItem('lastName');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
    localStorage.removeItem('userType');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  private clearTimers(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
    if (this.sessionTimer) {
      clearInterval(this.sessionTimer);
      this.sessionTimer = null;
    }
    this.clearWarningTimer();
  }

  private broadcastSessionData(): void {
    const sessionData: SessionData = {
      isActive: this.isSessionActive,
      sessionStartTime: this.sessionStartTime.toISOString(),
      lastActivityTime: this.lastActivityTime.toISOString(),
      timestamp: new Date().toISOString()
    };

    localStorage.setItem(SESSION_CONSTANTS.STORAGE_KEYS.SESSION_DATA, JSON.stringify(sessionData));
  }

  private syncSessionData(sessionData: SessionData): void {
    if (sessionData.isActive && !this.isSessionActive) {
      this.sessionStartTime = new Date(sessionData.sessionStartTime);
      this.lastActivityTime = new Date(sessionData.lastActivityTime);
      this.startSession();
    }
  }

  private clearSessionData(): void {
    localStorage.removeItem(SESSION_CONSTANTS.STORAGE_KEYS.SESSION_DATA);
  }

  private handleBrowserClose(): void {
    if (document.visibilityState === 'hidden') {
      this.sendLogoutBeacon();
      this.clearSessionData();
      this.stopSession();
    }
    sessionStorage.removeItem(SESSION_CONSTANTS.STORAGE_KEYS.BROWSER_CLOSING);
  }

  private sendLogoutBeacon(): void {
    try {
      const logoutData: LogoutBeaconData = {
        action: 'logout',
        reason: 'Browser close',
        timestamp: new Date().toISOString()
      };

      const formData = new FormData();
      formData.append('action', logoutData.action);
      formData.append('reason', logoutData.reason);
      formData.append('timestamp', logoutData.timestamp);
      if (navigator.sendBeacon) {
        navigator.sendBeacon(`${environment.secureUrl}${SESSION_CONSTANTS.API_ENDPOINTS.BEACON_LOGOUT}`, formData);
      }
    } catch (error) {
    }
  }

  private handleTabHidden(): void {
  }

  private handleTabVisible(): void {
    this.checkAuthenticationStatus();
  }

  private checkAuthenticationStatus(): void {
    this.authService.isAuthenticated().then(isAuthenticated => {
      if (!isAuthenticated && this.isSessionActive) {
        this.stopSession();
      }
    });
  }

  private handlePageUnload(): void {
    this.clearSessionData();
  }

  private updateSessionState(): void {
    if (!this.isSessionActive) {
      this.sessionStateSubject.next({
        isActive: false,
        timeRemaining: 0,
        isWarning: false
      });
      return;
    }

    const sessionDuration = new Date().getTime() - this.sessionStartTime.getTime();
    const maxSessionDuration = this.sessionConfig.sessionTimeoutMinutes * 60 * 1000;
    const timeRemaining = Math.max(0, maxSessionDuration - sessionDuration);
    const isWarning = timeRemaining <= (this.sessionConfig.warningTimeMinutes * 60 * 1000);

    this.sessionStateSubject.next({
      isActive: true,
      timeRemaining,
      isWarning
    });
  }

  public updateSessionConfig(config: Partial<SessionConfig>): void {
    this.sessionConfig = { ...this.sessionConfig, ...config };
    localStorage.setItem(SESSION_CONSTANTS.STORAGE_KEYS.SESSION_CONFIG, JSON.stringify(this.sessionConfig));
  }

  public getSessionConfig(): SessionConfig {
    return { ...this.sessionConfig };
  }

  public getSessionInfo(): SessionInfo {
    const sessionDuration = new Date().getTime() - this.sessionStartTime.getTime();
    const maxSessionDuration = this.sessionConfig.sessionTimeoutMinutes * 60 * 1000;
    const timeRemaining = Math.max(0, maxSessionDuration - sessionDuration);
    const isWarning = timeRemaining <= (this.sessionConfig.warningTimeMinutes * 60 * 1000);

    return {
      isActive: this.isSessionActive,
      sessionStartTime: this.sessionStartTime,
      lastActivityTime: this.lastActivityTime,
      timeRemaining,
      isWarning
    };
  }

  public refreshSession(): void {
    if (this.isSessionActive) {
      this.updateActivity();
    }
  }

  public destroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
    this.clearTimers();
    this.stopSession();
  }

  public enableBrowserCloseDetection(): void {
    this.sessionConfig.enableBrowserCloseDetection = true;
    this.setupBrowserCloseDetection();
  }

  public disableBrowserCloseDetection(): void {
    this.sessionConfig.enableBrowserCloseDetection = false;
  }
  public testLogout(): void {
    this.logout('Test logout');
  }
} 