import { Injectable } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';

@Injectable({
  providedIn: 'root'
})
export class SwErrorHandlerService {

  constructor(private swUpdate: SwUpdate) {
    this.initializeErrorHandling();
  }

  private initializeErrorHandling(): void {
    // Handle service worker errors globally
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('error', (error) => {
        console.warn('Service Worker Error:', error);
        this.handleServiceWorkerError(error);
      });

      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_ERROR') {
          console.warn('Service Worker reported error:', event.data.error);
          this.handleServiceWorkerError(event.data.error);
        }
      });
    }
  }

  private handleServiceWorkerError(error: any): void {
    // Check if it's the networkFirst strategy error
    if (error && error.message && error.message.includes('Unknown strategy: networkFirst')) {
      console.warn('Detected networkFirst strategy error, clearing cache and reloading...');
      this.clearServiceWorkerCache();
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }

  // Clear service worker cache
  async clearServiceWorkerCache(): Promise<void> {
    try {
      // Clear all caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('Service worker cache cleared');

      // Unregister service worker
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.unregister();
          console.log('Service worker unregistered');
        }
      }
    } catch (error) {
      console.error('Error clearing service worker cache:', error);
    }
  }

  // Force reload the application
  forceReload(): void {
    console.log('Force reloading application...');
    window.location.reload();
  }

  // Check if service worker is supported
  isServiceWorkerSupported(): boolean {
    return 'serviceWorker' in navigator;
  }

  // Unregister service worker if needed
  async unregisterServiceWorker(): Promise<boolean> {
    if (this.isServiceWorkerSupported()) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.unregister();
        console.log('Service worker unregistered');
        return true;
      }
    }
    return false;
  }

  // Handle authentication-related service worker issues
  handleAuthServiceWorkerIssue(): void {
    console.log('Handling authentication service worker issue...');
    this.clearServiceWorkerCache();
    
    // Clear any stored authentication data
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    sessionStorage.clear();
    
    // Force reload after a short delay
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }
} 