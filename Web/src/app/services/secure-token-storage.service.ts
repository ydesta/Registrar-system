import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

/**
 * Secure Token Storage Service
 * 
 * Security Features:
 * - Uses sessionStorage instead of localStorage for tokens (cleared on tab close)
 * - Token validation and sanitization
 * - Protection against XSS token theft (sessionStorage is slightly more secure)
 * - Automatic token expiration handling
 * 
 * Note: For maximum security, consider using httpOnly cookies (requires backend changes)
 */
@Injectable({
  providedIn: 'root'
})
export class SecureTokenStorageService {
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly TOKEN_EXPIRY_KEY = 'token_expiry';
  
  // Non-sensitive data can still use localStorage
  private readonly USER_DATA_PREFIX = 'user_data_';

  constructor() {
    // Clean up expired tokens on service initialization
    this.cleanupExpiredTokens();
  }

  /**
   * Stores access token securely in sessionStorage
   * @param token - JWT access token
   * @returns True if token was stored successfully, false otherwise
   */
  setAccessToken(token: string): boolean {
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      if (!environment.production) {
        console.warn('SecureTokenStorageService: Invalid token provided');
      }
      return false;
    }

    const trimmedToken = token.trim();
    
    // Validate token format (basic JWT validation) - but don't fail if validation fails
    // Some tokens might have slightly different formats, so we'll be lenient
    const isValidFormat = this.isValidTokenFormat(trimmedToken);
    if (!isValidFormat && !environment.production) {
      console.warn('SecureTokenStorageService: Token format validation failed, but storing anyway for compatibility');
    }

    try {
      // Store in sessionStorage (more secure than localStorage)
      sessionStorage.setItem(this.ACCESS_TOKEN_KEY, trimmedToken);
      
      // Extract and store token expiry if available
      const expiry = this.extractTokenExpiry(trimmedToken);
      if (expiry) {
        sessionStorage.setItem(this.TOKEN_EXPIRY_KEY, expiry.toString());
      }
      return true;
    } catch (error) {
      // If sessionStorage fails (e.g., private browsing), fallback to localStorage
      if (!environment.production) {
        console.warn('SecureTokenStorageService: sessionStorage failed, using localStorage fallback:', error);
      }
      try {
        localStorage.setItem(this.ACCESS_TOKEN_KEY, trimmedToken);
        const expiry = this.extractTokenExpiry(trimmedToken);
        if (expiry) {
          localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiry.toString());
        }
        return true;
      } catch (fallbackError) {
        console.error('SecureTokenStorageService: Error storing access token in both storages:', fallbackError);
        return false;
      }
    }
  }

  /**
   * Retrieves access token from sessionStorage
   * @returns Access token or null if not found/expired
   */
  getAccessToken(): string | null {
    try {
      // Try sessionStorage first
      let token = sessionStorage.getItem(this.ACCESS_TOKEN_KEY);
      let expiryKey = this.TOKEN_EXPIRY_KEY;
      
      // Fallback to localStorage if sessionStorage is empty (private browsing mode)
      if (!token) {
        token = localStorage.getItem(this.ACCESS_TOKEN_KEY);
      }
      
      if (!token) {
        return null;
      }

      // Check if token is expired (only if expiry info exists)
      const expiryStr = sessionStorage.getItem(expiryKey) || localStorage.getItem(expiryKey);
      if (expiryStr) {
        if (this.isTokenExpired()) {
          this.clearTokens();
          return null;
        }
      }

      return token;
    } catch (error) {
      // On error, try localStorage as fallback
      try {
        return localStorage.getItem(this.ACCESS_TOKEN_KEY);
      } catch (fallbackError) {
        if (!environment.production) {
          console.error('SecureTokenStorageService: Error retrieving access token:', error);
        }
        return null;
      }
    }
  }

  /**
   * Stores refresh token securely in sessionStorage
   * @param token - Refresh token
   * @returns True if token was stored successfully
   */
  setRefreshToken(token: string): boolean {
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      if (!environment.production) {
        console.warn('SecureTokenStorageService: Invalid refresh token provided');
      }
      return false;
    }

    try {
      sessionStorage.setItem(this.REFRESH_TOKEN_KEY, token.trim());
      return true;
    } catch (error) {
      // Fallback to localStorage if sessionStorage fails
      if (!environment.production) {
        console.warn('SecureTokenStorageService: sessionStorage failed, using localStorage fallback');
      }
      try {
        localStorage.setItem(this.REFRESH_TOKEN_KEY, token.trim());
        return true;
      } catch (fallbackError) {
        console.error('SecureTokenStorageService: Error storing refresh token:', fallbackError);
        return false;
      }
    }
  }

  /**
   * Retrieves refresh token from sessionStorage
   * @returns Refresh token or null if not found
   */
  getRefreshToken(): string | null {
    try {
      // Try sessionStorage first
      let token = sessionStorage.getItem(this.REFRESH_TOKEN_KEY);
      if (token) {
        return token;
      }
      // Fallback to localStorage
      return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      if (!environment.production) {
        console.error('SecureTokenStorageService: Error retrieving refresh token:', error);
      }
      return null;
    }
  }

  /**
   * Clears all tokens from storage
   */
  clearTokens(): void {
    try {
      sessionStorage.removeItem(this.ACCESS_TOKEN_KEY);
      sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
      sessionStorage.removeItem(this.TOKEN_EXPIRY_KEY);
      // Also clear from localStorage if they exist there
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    } catch (error) {
      if (!environment.production) {
        console.error('SecureTokenStorageService: Error clearing tokens:', error);
      }
    }
  }

  /**
   * Checks if a token exists and is valid
   * @returns True if valid token exists
   */
  hasValidToken(): boolean {
    const token = this.getAccessToken();
    return token !== null && !this.isTokenExpired();
  }

  /**
   * Validates token format (basic JWT validation)
   * @param token - Token to validate
   * @returns True if token format is valid
   */
  private isValidTokenFormat(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }

    const trimmedToken = token.trim();
    if (trimmedToken.length < 20) {
      // Tokens should be reasonably long
      return false;
    }

    // JWT tokens have 3 parts separated by dots
    const parts = trimmedToken.split('.');
    if (parts.length !== 3) {
      return false;
    }

    // Each part should be base64 encoded (basic check)
    // Base64 can include padding characters (=)
    try {
      parts.forEach(part => {
        if (part.length === 0) {
          throw new Error('Empty token part');
        }
        // Base64 validation including padding (=)
        if (!/^[A-Za-z0-9_-]+(=+)?$/.test(part)) {
          throw new Error('Invalid base64 characters');
        }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Extracts expiry time from JWT token
   * @param token - JWT token
   * @returns Expiry timestamp or null
   */
  private extractTokenExpiry(token: string): number | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      // Decode payload (second part)
      const payload = JSON.parse(atob(parts[1]));
      if (payload && payload.exp) {
        return payload.exp * 1000; // Convert to milliseconds
      }
      return null;
    } catch (error) {
      // Token parsing failed, return null
      return null;
    }
  }

  /**
   * Checks if token is expired
   * @returns True if token is expired
   */
  private isTokenExpired(): boolean {
    try {
      // Check both sessionStorage and localStorage for expiry
      const expiryStr = sessionStorage.getItem(this.TOKEN_EXPIRY_KEY) || 
                       localStorage.getItem(this.TOKEN_EXPIRY_KEY);
      if (!expiryStr) {
        return false; // No expiry info, assume valid
      }

      const expiry = parseInt(expiryStr, 10);
      if (isNaN(expiry)) {
        return false; // Invalid expiry, assume valid
      }

      const now = Date.now();
      
      // Add 60 second buffer before actual expiry
      // Only mark as expired if we're past the buffer time
      return now >= (expiry - 60000);
    } catch (error) {
      return false; // On error, assume not expired
    }
  }

  /**
   * Cleans up expired tokens
   */
  private cleanupExpiredTokens(): void {
    if (this.isTokenExpired()) {
      this.clearTokens();
    }
  }

  /**
   * Stores non-sensitive user data in localStorage
   * (User preferences, display settings, etc.)
   * @param key - Data key
   * @param value - Data value
   */
  setUserData(key: string, value: string): void {
    try {
      const storageKey = `${this.USER_DATA_PREFIX}${key}`;
      localStorage.setItem(storageKey, value);
    } catch (error) {
      console.error('SecureTokenStorageService: Error storing user data:', error);
    }
  }

  /**
   * Retrieves non-sensitive user data from localStorage
   * @param key - Data key
   * @returns Data value or null
   */
  getUserData(key: string): string | null {
    try {
      const storageKey = `${this.USER_DATA_PREFIX}${key}`;
      return localStorage.getItem(storageKey);
    } catch (error) {
      console.error('SecureTokenStorageService: Error retrieving user data:', error);
      return null;
    }
  }

  /**
   * Clears all user data from localStorage
   */
  clearUserData(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.USER_DATA_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('SecureTokenStorageService: Error clearing user data:', error);
    }
  }

  /**
   * Migrates tokens from localStorage to sessionStorage
   * Call this once during app initialization to migrate existing tokens
   * Only migrates if tokens don't already exist in sessionStorage
   */
  migrateFromLocalStorage(): void {
    try {
      // Only migrate if sessionStorage doesn't already have tokens
      const existingToken = sessionStorage.getItem(this.ACCESS_TOKEN_KEY);
      if (existingToken) {
        // Already have token in sessionStorage, skip migration
        return;
      }

      // Check if tokens exist in localStorage
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');

      // Only remove from localStorage if migration was successful
      if (accessToken) {
        const migrated = this.setAccessToken(accessToken);
        if (migrated) {
          // Only remove from localStorage after successful migration
          localStorage.removeItem('access_token');
        }
        // If migration failed, keep token in localStorage as fallback
      }

      if (refreshToken) {
        const migrated = this.setRefreshToken(refreshToken);
        if (migrated) {
          // Only remove from localStorage after successful migration
          localStorage.removeItem('refresh_token');
        }
        // If migration failed, keep token in localStorage as fallback
      }
    } catch (error) {
      if (!environment.production) {
        console.error('SecureTokenStorageService: Error migrating tokens:', error);
      }
      // Don't throw - allow fallback to localStorage
    }
  }
}
