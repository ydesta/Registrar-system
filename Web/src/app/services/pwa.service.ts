import { Injectable } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private deferredPrompt: any;
  private lastUpdateVersion = '';
  private readonly installPromptSource = new BehaviorSubject<boolean>(false);
  private readonly updateAvailableSource = new BehaviorSubject<boolean>(false);
  readonly installPrompt$ = this.installPromptSource.asObservable();
  readonly updateAvailable$ = this.updateAvailableSource.asObservable();

  constructor(private swUpdate: SwUpdate) {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.installPromptSource.next(true);
    });
    window.addEventListener('appinstalled', () => {
      this.installPromptSource.next(false);
      this.deferredPrompt = null;
    });
    if (this.swUpdate.isEnabled) {
      this.swUpdate.available.subscribe(event => {
        const version = (event.current.appData as any)?.version || 'unknown';
        if (localStorage.getItem('pwa_last_notified_version') !== version) {
          this.lastUpdateVersion = version;
          this.updateAvailableSource.next(true);
          localStorage.setItem('pwa_last_notified_version', version);
        }
      });
    }
  }

  async installPWA(): Promise<void> {
    if (!this.deferredPrompt) {
      return;
    }
    this.deferredPrompt.prompt();
    await this.deferredPrompt.userChoice;
    this.deferredPrompt = null;
    this.installPromptSource.next(false);
  }

  async checkForUpdate(): Promise<void> {
    if (this.swUpdate.isEnabled) {
      await this.swUpdate.checkForUpdate().catch(() => {});
    }
  }

  async activateUpdate(): Promise<void> {
    if (!this.swUpdate.isEnabled) {
      return;
    }
    try {
      await this.swUpdate.activateUpdate();
      localStorage.removeItem('pwa_last_notified_version');
      window.location.reload();
    } catch {
    }
  }

  dismissUpdateNotification(): void {
    this.updateAvailableSource.next(false);
  }

  getUpdateVersion(): string {
    return this.lastUpdateVersion;
  }

  isStandalone(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
  }

  isPWAInstalled(): boolean {
    return this.isStandalone();
  }

  isOnline(): boolean {
    return navigator.onLine;
  }

  clearNotificationState(): void {
    localStorage.removeItem('pwa_last_notified_version');
  }
}
