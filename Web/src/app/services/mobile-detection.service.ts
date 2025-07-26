import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MobileDetectionService {

  constructor() { }

  isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  isAndroid(): boolean {
    return /Android/.test(navigator.userAgent);
  }

  getConnectionType(): string {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return connection ? connection.effectiveType || 'unknown' : 'unknown';
    }
    return 'unknown';
  }

  isSlowConnection(): boolean {
    const connectionType = this.getConnectionType();
    return connectionType === 'slow-2g' || connectionType === '2g' || connectionType === '3g';
  }

  // Handle mobile-specific network issues
  handleMobileNetworkError(error: any): void {
    if (this.isMobileDevice()) {
      console.warn('Mobile device network error detected');
      
      if (this.isSlowConnection()) {
        console.warn('Slow connection detected on mobile device');
        // Implement slow connection handling
      }
      
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        console.error('Mobile network connectivity issue');
        this.showMobileNetworkError();
      }
    }
  }

  private showMobileNetworkError(): void {
    // You can implement mobile-specific error handling here
    console.warn('Mobile network error - please check your connection');
  }

  // Get device information for debugging
  getDeviceInfo(): any {
    return {
      userAgent: navigator.userAgent,
      isMobile: this.isMobileDevice(),
      isIOS: this.isIOS(),
      isAndroid: this.isAndroid(),
      connectionType: this.getConnectionType(),
      isSlowConnection: this.isSlowConnection(),
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight
    };
  }
} 