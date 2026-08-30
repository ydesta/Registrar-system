import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { BehaviorSubject, Subject, fromEvent, merge } from 'rxjs';
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
  private destroy$ = new Subject<void>();

  private sessionStateSubject = new BehaviorSubject<SessionState>({
    isActive: false,
    timeRemaining: 0,
    isWarning: false
  });

  public sessionState$ = this.sessionStateSubject.asObservable();

  constructor(private authService: AuthService) {
    this.loadSessionConfig();
    this.initializeSessionManagement();
  }

  private loadSessionConfig(): void {
    const savedConfig = localStorage.getItem(SESSION_CONSTANTS.STORAGE_KEYS.SESSION_CONFIG);
    if (!savedConfig) {
      return;
    }
    try {
      this.sessionConfig = { ...this.sessionConfig, ...JSON.parse(savedConfig) };
    } catch {
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
    merge(...SESSION_CONSTANTS.ACTIVITY_EVENTS.map(event => fromEvent(document, event)))
      .pipe(
        debounceTime(SESSION_CONSTANTS.TIMERS.ACTIVITY_DEBOUNCE_MS),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.updateActivity());
  }

  private setupTabSync(): void {
    window.addEventListener('storage', event => {
      if (event.key !== SESSION_CONSTANTS.STORAGE_KEYS.SESSION_DATA) {
        return;
      }
      try {
        this.syncSessionData(JSON.parse(event.newValue || '{}'));
      } catch {
      }
    });
    this.broadcastSessionData();
  }

  private setupBrowserCloseDetection(): void {
    window.addEventListener('pagehide', event => {
      if (this.isSessionActive && event.persisted === false) {
        setTimeout(() => this.handleBrowserClose(), SESSION_CONSTANTS.TIMERS.BROWSER_CLOSE_DELAY_MS);
      }
    });
    document.addEventListener('visibilitychange', () => {
      if (!this.isSessionActive) {
        return;
      }
      if (document.visibilityState === 'visible') {
        this.checkAuthenticationStatus();
      }
    });
    window.addEventListener('storage', event => {
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
    this.inactivityTimer = setTimeout(
      () => this.handleInactivityTimeout(),
      this.sessionConfig.inactivityTimeoutMinutes * 60 * 1000
    );
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
    this.sessionTimer = setInterval(() => this.checkSessionTimeout(), 60000);
  }

  private checkSessionTimeout(): void {
    const timeRemaining = this.remainingMs();
    if (timeRemaining <= 0) {
      this.handleSessionTimeout();
      return;
    }
    const warningTime = this.sessionConfig.warningTimeMinutes * 60 * 1000;
    if (timeRemaining <= warningTime && !this.warningTimer) {
      this.showSessionWarning(timeRemaining);
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
    if (confirm(`${warningMessage}\n\nClick OK to stay logged in or Cancel to logout now.`)) {
      this.updateActivity();
    } else {
      this.logout('Logged out due to inactivity');
    }
  }

  private showSessionWarning(timeRemaining: number): void {
    this.warningTimer = setTimeout(() => {
      this.warningTimer = null;
    }, timeRemaining);
    const minutes = Math.floor(timeRemaining / 60000);
    if (confirm(`Your session will expire in ${minutes} minutes. Do you want to extend your session?`)) {
      this.extendSession();
    } else {
      this.logout('Session expired');
    }
  }

  private extendSession(): void {
    this.authService.extendSession().subscribe({
      next: () => {
        this.sessionStartTime = new Date();
        this.updateActivity();
        this.clearWarningTimer();
      },
      error: () => this.logout('Failed to extend session')
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
    SESSION_CONSTANTS.AUTH_KEYS.forEach(key => localStorage.removeItem(key));
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
      navigator.sendBeacon?.(
        `${environment.secureUrl}${SESSION_CONSTANTS.API_ENDPOINTS.BEACON_LOGOUT}`,
        formData
      );
    } catch {
    }
  }

  private checkAuthenticationStatus(): void {
    this.authService.isAuthenticated().then(isAuthenticated => {
      if (!isAuthenticated && this.isSessionActive) {
        this.stopSession();
      }
    });
  }

  private remainingMs(): number {
    const sessionDuration = Date.now() - this.sessionStartTime.getTime();
    const maxSessionDuration = this.sessionConfig.sessionTimeoutMinutes * 60 * 1000;
    return Math.max(0, maxSessionDuration - sessionDuration);
  }

  private updateSessionState(): void {
    if (!this.isSessionActive) {
      this.sessionStateSubject.next({ isActive: false, timeRemaining: 0, isWarning: false });
      return;
    }
    const timeRemaining = this.remainingMs();
    this.sessionStateSubject.next({
      isActive: true,
      timeRemaining,
      isWarning: timeRemaining <= this.sessionConfig.warningTimeMinutes * 60 * 1000
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
    const timeRemaining = this.remainingMs();
    return {
      isActive: this.isSessionActive,
      sessionStartTime: this.sessionStartTime,
      lastActivityTime: this.lastActivityTime,
      timeRemaining,
      isWarning: timeRemaining <= this.sessionConfig.warningTimeMinutes * 60 * 1000
    };
  }

  public refreshSession(): void {
    if (this.isSessionActive) {
      this.updateActivity();
    }
  }

  public destroy(): void {
    this.destroy$.next();
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
