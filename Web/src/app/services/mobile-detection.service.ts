import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MobileDetectionService {
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
    const connection = (navigator as any).connection;
    return connection?.effectiveType || 'unknown';
  }

  isSlowConnection(): boolean {
    const connectionType = this.getConnectionType();
    return connectionType === 'slow-2g' || connectionType === '2g' || connectionType === '3g';
  }
}
