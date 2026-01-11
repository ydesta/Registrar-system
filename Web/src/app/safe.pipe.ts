import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '../environments/environment';

/**
 * SafePipe - Validates URLs before bypassing security
 * 
 * Security Features:
 * - Validates URL protocol (only allows http/https)
 * - Validates URL origin against whitelist
 * - Blocks dangerous protocols (javascript:, data:, etc.)
 * - Returns safe fallback for invalid URLs
 */
@Pipe({
  name: 'safe'
})
export class SafePipe implements PipeTransform {

  // Allowed domains/origins for resource URLs (lazy-loaded)
  private _allowedOrigins: string[] | null = null;

  // Allowed protocols
  private readonly allowedProtocols: string[] = ['http:', 'https:'];

  // Dangerous protocols that should never be allowed
  private readonly dangerousProtocols: string[] = [
    'javascript:',
    'data:',
    'vbscript:',
    'file:',
    'about:',
    'blob:'
  ];

  constructor(private sanitizer: DomSanitizer) { }

  /**
   * Gets allowed origins from environment configuration and trusted sources
   * Uses lazy loading to ensure environment is available
   */
  private getAllowedOrigins(): string[] {
    if (this._allowedOrigins !== null) {
      return this._allowedOrigins;
    }

    const origins: string[] = [
      'localhost',
      '127.0.0.1',
      'hilcoe.edu.et',
      'staging.hilcoe.edu.et',
      'hsis.hilcoe.edu.et'
    ];

    // Extract domains from environment URLs
    try {
      if (environment.fileUrl) {
        const fileUrl = new URL(environment.fileUrl);
        if (!origins.includes(fileUrl.hostname)) {
          origins.push(fileUrl.hostname);
        }
      }
      if (environment.baseUrl) {
        const baseUrl = new URL(environment.baseUrl);
        if (!origins.includes(baseUrl.hostname)) {
          origins.push(baseUrl.hostname);
        }
      }
      if (environment.secureUrl) {
        const secureUrl = new URL(environment.secureUrl);
        if (!origins.includes(secureUrl.hostname)) {
          origins.push(secureUrl.hostname);
        }
      }
    } catch (e) {
      // If URL parsing fails, continue with default origins
      if (!environment.production) {
        console.warn('SafePipe: Could not parse environment URLs for allowed origins');
      }
    }

    this._allowedOrigins = origins;
    return this._allowedOrigins;
  }

  transform(url: any): SafeResourceUrl {
    // Return empty safe URL if input is invalid
    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      return this.sanitizer.bypassSecurityTrustResourceUrl('about:blank');
    }

    const trimmedUrl = url.trim();

    // Check for dangerous protocols
    const lowerUrl = trimmedUrl.toLowerCase();
    for (const dangerousProtocol of this.dangerousProtocols) {
      if (lowerUrl.startsWith(dangerousProtocol)) {
        console.warn(`SafePipe: Blocked dangerous protocol in URL: ${trimmedUrl.substring(0, 50)}...`);
        return this.sanitizer.bypassSecurityTrustResourceUrl('about:blank');
      }
    }

    try {
      // Parse the URL to validate it
      let urlObj: URL;
      try {
        urlObj = new URL(trimmedUrl);
      } catch (e) {
        // If URL parsing fails, try to construct a valid URL
        // This handles relative URLs or URLs without protocol
        if (trimmedUrl.startsWith('//')) {
          // Protocol-relative URL - prepend https
          urlObj = new URL('https:' + trimmedUrl);
        } else if (trimmedUrl.startsWith('/')) {
          // Absolute path - use current origin
          urlObj = new URL(trimmedUrl, window.location.origin);
        } else {
          // Relative path - use current origin
          urlObj = new URL(trimmedUrl, window.location.origin);
        }
      }

      // Validate protocol
      if (!this.allowedProtocols.includes(urlObj.protocol.toLowerCase())) {
        console.warn(`SafePipe: Blocked invalid protocol '${urlObj.protocol}' in URL: ${trimmedUrl.substring(0, 50)}...`);
        return this.sanitizer.bypassSecurityTrustResourceUrl('about:blank');
      }

      // Validate origin/hostname
      const hostname = urlObj.hostname.toLowerCase();
      const allowedOrigins = this.getAllowedOrigins();
      const isAllowed = allowedOrigins.some(allowed => {
        // Exact match
        if (hostname === allowed) {
          return true;
        }
        // Subdomain match (e.g., staging.hilcoe.edu.et matches hilcoe.edu.et)
        if (hostname.endsWith('.' + allowed)) {
          return true;
        }
        // For localhost, allow any port
        if (allowed === 'localhost' && (hostname === 'localhost' || hostname === '127.0.0.1')) {
          return true;
        }
        return false;
      });

      if (!isAllowed) {
        // In development, allow localhost connections even if not in whitelist
        const isDevelopment = !environment.production;
        const isLocalhost = hostname === 'localhost' || 
                          hostname === '127.0.0.1' || 
                          hostname.startsWith('192.168.') ||
                          hostname.startsWith('10.') ||
                          hostname.startsWith('172.');

        if (!isDevelopment || !isLocalhost) {
          console.warn(`SafePipe: Blocked untrusted origin '${hostname}' in URL: ${trimmedUrl.substring(0, 50)}...`);
          return this.sanitizer.bypassSecurityTrustResourceUrl('about:blank');
        }
      }

      // Additional validation: Check for suspicious patterns
      if (this.containsSuspiciousPattern(trimmedUrl)) {
        console.warn(`SafePipe: Blocked suspicious URL pattern: ${trimmedUrl.substring(0, 50)}...`);
        return this.sanitizer.bypassSecurityTrustResourceUrl('about:blank');
      }

      // URL is valid - return sanitized resource URL
      return this.sanitizer.bypassSecurityTrustResourceUrl(trimmedUrl);

    } catch (error) {
      // If any validation fails, return safe fallback
      console.error('SafePipe: Error validating URL:', error);
      return this.sanitizer.bypassSecurityTrustResourceUrl('about:blank');
    }
  }

  /**
   * Checks for suspicious patterns in URLs that might indicate XSS or injection attempts
   */
  private containsSuspiciousPattern(url: string): boolean {
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i, // Event handlers like onclick=
      /expression\s*\(/i, // CSS expressions
      /vbscript:/i,
      /data:text\/html/i,
      /%3Cscript/i, // URL-encoded script tag
      /%3C%2Fscript/i, // URL-encoded closing script tag
    ];

    return suspiciousPatterns.some(pattern => pattern.test(url));
  }
}
