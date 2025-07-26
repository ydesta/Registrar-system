import { Observable } from 'rxjs';

export interface SessionConfig {
  inactivityTimeoutMinutes: number;
  sessionTimeoutMinutes: number;
  warningTimeMinutes: number;
  enableActivityTracking: boolean;
  enableTabSync: boolean;
  enableBrowserCloseDetection: boolean;
}

export interface SessionState {
  isActive: boolean;
  timeRemaining: number;
  isWarning: boolean;
}

export interface SessionInfo {
  isActive: boolean;
  sessionStartTime: Date;
  lastActivityTime: Date;
  timeRemaining: number;
  isWarning: boolean;
}

export interface SessionData {
  isActive: boolean;
  sessionStartTime: string;
  lastActivityTime: string;
  timestamp: string;
}

export interface LogoutBeaconData {
  action: string;
  reason: string;
  timestamp: string;
}

export interface ISessionManagementService {
  sessionState$: Observable<SessionState>;
  
  updateSessionConfig(config: Partial<SessionConfig>): void;
  getSessionConfig(): SessionConfig;
  getSessionInfo(): SessionInfo;
  refreshSession(): void;
  destroy(): void;
  enableBrowserCloseDetection(): void;
  disableBrowserCloseDetection(): void;
  testLogout(): void;
} 