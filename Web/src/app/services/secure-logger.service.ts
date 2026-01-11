import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

/**
 * Secure logging service that prevents sensitive data from being logged in production.
 * All console statements should go through this service to ensure production safety.
 */
@Injectable({
  providedIn: 'root'
})
export class SecureLoggerService {

  /**
   * Logs information only in development mode
   * @param message - Log message
   * @param data - Optional data to log (will be sanitized in production)
   */
  log(message: string, data?: any): void {
    if (!environment.production) {
      if (data !== undefined) {
        console.log(message, this.sanitizeData(data));
      } else {
        console.log(message);
      }
    }
  }

  /**
   * Logs errors (always logged, but sensitive data is sanitized)
   * @param message - Error message
   * @param error - Error object or data (will be sanitized in production)
   */
  error(message: string, error?: any): void {
    if (!environment.production) {
      if (error !== undefined) {
        console.error(message, this.sanitizeData(error));
      } else {
        console.error(message);
      }
    } else {
      // In production, log minimal error info without sensitive data
      console.error(message);
    }
  }

  /**
   * Logs warnings only in development mode
   * @param message - Warning message
   * @param data - Optional data to log (will be sanitized in production)
   */
  warn(message: string, data?: any): void {
    if (!environment.production) {
      if (data !== undefined) {
        console.warn(message, this.sanitizeData(data));
      } else {
        console.warn(message);
      }
    }
  }

  /**
   * Logs info only in development mode
   * @param message - Info message
   * @param data - Optional data to log (will be sanitized in production)
   */
  info(message: string, data?: any): void {
    if (!environment.production) {
      if (data !== undefined) {
        console.info(message, this.sanitizeData(data));
      } else {
        console.info(message);
      }
    }
  }

  /**
   * Logs debug information only in development mode
   * @param message - Debug message
   * @param data - Optional data to log (will be sanitized in production)
   */
  debug(message: string, data?: any): void {
    if (!environment.production) {
      if (data !== undefined) {
        console.debug(message, this.sanitizeData(data));
      } else {
        console.debug(message);
      }
    }
  }

  /**
   * Sanitizes data to remove sensitive information before logging
   * @param data - Data to sanitize
   * @returns Sanitized data object
   */
  private sanitizeData(data: any): any {
    if (!data) {
      return data;
    }

    // If it's a string, check for sensitive patterns
    if (typeof data === 'string') {
      return this.sanitizeString(data);
    }

    // If it's an object, recursively sanitize
    if (typeof data === 'object') {
      const sanitized: any = Array.isArray(data) ? [] : {};
      
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          const lowerKey = key.toLowerCase();
          
          // Remove or mask sensitive fields
          if (this.isSensitiveField(lowerKey)) {
            sanitized[key] = '[REDACTED]';
          } else if (typeof data[key] === 'object' && data[key] !== null) {
            sanitized[key] = this.sanitizeData(data[key]);
          } else if (typeof data[key] === 'string') {
            sanitized[key] = this.sanitizeString(data[key]);
          } else {
            sanitized[key] = data[key];
          }
        }
      }
      
      return sanitized;
    }

    return data;
  }

  /**
   * Checks if a field name indicates sensitive data
   * @param fieldName - Field name to check
   * @returns True if field is sensitive
   */
  private isSensitiveField(fieldName: string): boolean {
    const sensitiveFields = [
      'token', 'password', 'secret', 'key', 'credential', 'auth',
      'authorization', 'apikey', 'api_key', 'access_token', 'refresh_token',
      'session', 'cookie', 'ssn', 'social', 'security', 'pin', 'pwd',
      'passwd', 'passphrase', 'private', 'jwt', 'bearer'
    ];
    
    return sensitiveFields.some(field => fieldName.includes(field));
  }

  /**
   * Sanitizes strings to remove potential sensitive data
   * @param str - String to sanitize
   * @returns Sanitized string
   */
  private sanitizeString(str: string): string {
    if (!str || str.length === 0) {
      return str;
    }

    // Check if string looks like a JWT token (three parts separated by dots)
    if (/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(str)) {
      return '[JWT_TOKEN_REDACTED]';
    }

    // Check if string looks like an email (basic check)
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) {
      // In production, mask email addresses
      if (environment.production) {
        const [localPart, domain] = str.split('@');
        return `${localPart.substring(0, 2)}***@${domain}`;
      }
    }

    // Check if string contains password-like patterns
    if (str.toLowerCase().includes('password') || str.toLowerCase().includes('token')) {
      return '[SENSITIVE_DATA_REDACTED]';
    }

    return str;
  }
}
