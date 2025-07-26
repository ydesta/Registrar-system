import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BrowserCloseService {
  private browserClosingSubject = new BehaviorSubject<boolean>(false);
  public browserClosing$ = this.browserClosingSubject.asObservable();

  private heartbeatInterval: any;
  private lastHeartbeat: number = Date.now();
  private readonly HEARTBEAT_INTERVAL = 1000; // 1 second
  private readonly HEARTBEAT_TIMEOUT = 3000; // 3 seconds

  constructor() {
    this.initializeBrowserCloseDetection();
    this.startHeartbeat();
  }

  private initializeBrowserCloseDetection(): void {
    let isClosing = false;
    let tabHiddenTime = 0;
    window.addEventListener('beforeunload', (event) => {
      isClosing = true;
      if (navigator.sendBeacon) {
        const data = new FormData();
        data.append('event', 'beforeunload');
        data.append('timestamp', Date.now().toString());
        navigator.sendBeacon('/api/authentication/beacon-logout', data);
      }
    });
    window.addEventListener('pagehide', (event) => {
      if (event.persisted === false && isClosing) {
        this.handleBrowserClose();
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        tabHiddenTime = Date.now();
        setTimeout(() => {
          const timeHidden = Date.now() - tabHiddenTime;
          if (document.visibilityState === 'hidden' && timeHidden > 5000) {
            this.handleBrowserClose();
          }
        }, 5000);

      } else {
        tabHiddenTime = 0;
        isClosing = false;
      }
    });

    window.addEventListener('unload', () => {
      if (isClosing) {
        this.handleBrowserClose();
      }
    });

    window.addEventListener('storage', (event) => {
      if (event.key === 'browserClosing' && event.newValue === 'true') {
        this.handleBrowserClose();
      }
    });
    window.addEventListener('blur', () => {
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
      if (storedHeartbeat) {
        const timeDiff = Date.now() - parseInt(storedHeartbeat);
        if (timeDiff > this.HEARTBEAT_TIMEOUT) {
          this.handleBrowserClose();
        }
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  private handleBrowserClose(): void {
    this.browserClosingSubject.next(true);
    sessionStorage.setItem('browserClosing', 'true');
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



  private clearSessionData(): void {
    sessionStorage.removeItem('sessionData');
    sessionStorage.removeItem('heartbeat');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('sessionData');
  }

  public isBrowserClosing(): boolean {
    return this.browserClosingSubject.value;
  }

  public resetBrowserClosingState(): void {
    this.browserClosingSubject.next(false);
    sessionStorage.removeItem('browserClosing');
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