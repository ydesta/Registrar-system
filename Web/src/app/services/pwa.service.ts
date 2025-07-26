import { Injectable } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private deferredPrompt: any;
  private installPromptSource = new BehaviorSubject<boolean>(false);
  private updateAvailableSource = new BehaviorSubject<boolean>(false);
  public installPrompt$ = this.installPromptSource.asObservable();
  public updateAvailable$ = this.updateAvailableSource.asObservable();
  private lastUpdateVersion: string = '';

  constructor(private swUpdate: SwUpdate) {
    this.initializePWA();
  }

  private initializePWA(): void {
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
      this.swUpdate.available.subscribe((event) => {
        const updateVersion = (event.current.appData as any)?.version || 'unknown';
        this.handleUpdateAvailable(updateVersion);
      });
    }
  }

  private handleUpdateAvailable(version: string): void {
    const lastNotifiedVersion = localStorage.getItem('pwa_last_notified_version');

    if (lastNotifiedVersion !== version) {
      this.lastUpdateVersion = version;
      this.updateAvailableSource.next(true);
      localStorage.setItem('pwa_last_notified_version', version);
    } else {
    }
  }

  public async installPWA(): Promise<void> {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      if (outcome === 'accepted') {
      } else {
      }
      this.deferredPrompt = null;
      this.installPromptSource.next(false);
    }
  }

  public async checkForUpdate(): Promise<void> {
    if (this.swUpdate.isEnabled) {
      try {
        await this.swUpdate.checkForUpdate();
      } catch (error) {
      }
    }
  }

  public async activateUpdate(): Promise<void> {
    if (this.swUpdate.isEnabled) {
      try {
        await this.swUpdate.activateUpdate();
        localStorage.removeItem('pwa_last_notified_version');
        window.location.reload();
      } catch (error) {
      }
    }
  }

  public dismissUpdateNotification(): void {
    this.updateAvailableSource.next(false);
  }

  public getUpdateVersion(): string {
    return this.lastUpdateVersion;
  }

  public isPWAInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
  }

  public isStandalone(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
  }

  public isOnline(): boolean {
    return navigator.onLine;
  }

  public clearNotificationState(): void {
    localStorage.removeItem('pwa_last_notified_version');
  }
} 