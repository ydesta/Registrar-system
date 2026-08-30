import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { SESSION_CONSTANTS } from './session-management.constants';

@Injectable({
  providedIn: 'root'
})
export class BrowserCloseService {
  private browserClosingSubject = new BehaviorSubject<boolean>(false);
  public browserClosing$ = this.browserClosingSubject.asObservable();

  private heartbeatInterval: any;
  private lastHeartbeat: number = Date.now();
  private readonly HEARTBEAT_INTERVAL = 1000;
  private readonly HEARTBEAT_TIMEOUT = 3000;

  constructor() {
    this.initializeBrowserCloseDetection();
    this.startHeartbeat();
  }

  private initializeBrowserCloseDetection(): void {
    let isClosing = false;
    let tabHiddenTime = 0;

    window.addEventListener('beforeunload', () => {
      isClosing = true;
      const data = new FormData();
      data.append('event', 'beforeunload');
      data.append('timestamp', Date.now().toString());
      navigator.sendBeacon?.(`${environment.secureUrl}${SESSION_CONSTANTS.API_ENDPOINTS.BEACON_LOGOUT}`, data);
    });

    window.addEventListener('pagehide', event => {
      if (event.persisted === false && isClosing) {
        this.handleBrowserClose();
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        tabHiddenTime = Date.now();
        setTimeout(() => {
          if (document.visibilityState === 'hidden' && Date.now() - tabHiddenTime > 5000) {
            this.handleBrowserClose();
          }
        }, 5000);
        return;
      }
      tabHiddenTime = 0;
      isClosing = false;
    });

    window.addEventListener('unload', () => {
      if (isClosing) {
        this.handleBrowserClose();
      }
    });

    window.addEventListener('storage', event => {
      if (event.key === SESSION_CONSTANTS.STORAGE_KEYS.BROWSER_CLOSING && event.newValue === 'true') {
        this.handleBrowserClose();
      }
    });

    window.addEventListener('focus', () => {
      isClosing = false;
      tabHiddenTime = 0;
    });
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.lastHeartbeat = Date.now();
      sessionStorage.setItem('heartbeat', this.lastHeartbeat.toString());
      const storedHeartbeat = sessionStorage.getItem('heartbeat');
      if (storedHeartbeat && Date.now() - parseInt(storedHeartbeat, 10) > this.HEARTBEAT_TIMEOUT) {
        this.handleBrowserClose();
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  private handleBrowserClose(): void {
    this.browserClosingSubject.next(true);
    sessionStorage.setItem(SESSION_CONSTANTS.STORAGE_KEYS.BROWSER_CLOSING, 'true');
    this.clearSessionData();
    SESSION_CONSTANTS.AUTH_KEYS.forEach(key => localStorage.removeItem(key));
  }

  private clearSessionData(): void {
    sessionStorage.removeItem(SESSION_CONSTANTS.STORAGE_KEYS.SESSION_DATA);
    sessionStorage.removeItem('heartbeat');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem(SESSION_CONSTANTS.STORAGE_KEYS.SESSION_DATA);
  }

  public isBrowserClosing(): boolean {
    return this.browserClosingSubject.value;
  }

  public resetBrowserClosingState(): void {
    this.browserClosingSubject.next(false);
    sessionStorage.removeItem(SESSION_CONSTANTS.STORAGE_KEYS.BROWSER_CLOSING);
  }

  public destroy(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
  }

  public testBrowserClose(): void {
    this.handleBrowserClose();
  }
}
