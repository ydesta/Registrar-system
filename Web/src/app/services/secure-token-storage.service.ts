import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SecureTokenStorageService {
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly TOKEN_EXPIRY_KEY = 'token_expiry';
  private readonly USER_DATA_PREFIX = 'user_data_';

  constructor() {
    this.cleanupExpiredTokens();
  }

  setAccessToken(token: string): boolean {
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return false;
    }
    const trimmedToken = token.trim();
    if (!this.write(this.ACCESS_TOKEN_KEY, trimmedToken)) {
      return false;
    }
    const expiry = this.extractTokenExpiry(trimmedToken);
    if (expiry) {
      this.write(this.TOKEN_EXPIRY_KEY, expiry.toString());
    }
    return true;
  }

  getAccessToken(): string | null {
    const token = this.read(this.ACCESS_TOKEN_KEY);
    if (!token) {
      return null;
    }
    if (this.isTokenExpired()) {
      this.clearTokens();
      return null;
    }
    return token;
  }

  setRefreshToken(token: string): boolean {
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return false;
    }
    return this.write(this.REFRESH_TOKEN_KEY, token.trim());
  }

  getRefreshToken(): string | null {
    return this.read(this.REFRESH_TOKEN_KEY);
  }

  clearTokens(): void {
    this.remove(this.ACCESS_TOKEN_KEY);
    this.remove(this.REFRESH_TOKEN_KEY);
    this.remove(this.TOKEN_EXPIRY_KEY);
  }

  hasValidToken(): boolean {
    return this.getAccessToken() !== null && !this.isTokenExpired();
  }

  setUserData(key: string, value: string): void {
    try {
      localStorage.setItem(`${this.USER_DATA_PREFIX}${key}`, value);
    } catch {
    }
  }

  getUserData(key: string): string | null {
    try {
      return localStorage.getItem(`${this.USER_DATA_PREFIX}${key}`);
    } catch {
      return null;
    }
  }

  clearUserData(): void {
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith(this.USER_DATA_PREFIX))
        .forEach(key => localStorage.removeItem(key));
    } catch {
    }
  }

  migrateFromLocalStorage(): void {
    try {
      if (sessionStorage.getItem(this.ACCESS_TOKEN_KEY)) {
        return;
      }
      const accessToken = localStorage.getItem(this.ACCESS_TOKEN_KEY);
      const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
      if (accessToken && this.setAccessToken(accessToken)) {
        localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      }
      if (refreshToken && this.setRefreshToken(refreshToken)) {
        localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      }
    } catch {
    }
  }

  private extractTokenExpiry(token: string): number | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }
      const payload = JSON.parse(atob(parts[1]));
      return payload?.exp ? payload.exp * 1000 : null;
    } catch {
      return null;
    }
  }

  private isTokenExpired(): boolean {
    try {
      const expiryStr = this.read(this.TOKEN_EXPIRY_KEY);
      if (!expiryStr) {
        return false;
      }
      const expiry = parseInt(expiryStr, 10);
      return !isNaN(expiry) && Date.now() >= expiry - 60000;
    } catch {
      return false;
    }
  }

  private cleanupExpiredTokens(): void {
    if (this.isTokenExpired()) {
      this.clearTokens();
    }
  }

  private read(key: string): string | null {
    try {
      return sessionStorage.getItem(key) || localStorage.getItem(key);
    } catch {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    }
  }

  private write(key: string, value: string): boolean {
    try {
      sessionStorage.setItem(key, value);
      return true;
    } catch {
      try {
        localStorage.setItem(key, value);
        return true;
      } catch {
        return false;
      }
    }
  }

  private remove(key: string): void {
    try {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    } catch {
    }
  }
}
