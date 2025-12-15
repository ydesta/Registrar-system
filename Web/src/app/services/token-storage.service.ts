import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {
  constructor() { }

  private getUserKey(userId: string, key: string): string {
    return `user_${userId}_${key}`;
  }

  public getCurrentUserId(): string {
    return localStorage.getItem('currentUserId') || '';
  }

  signOut() {
    const userId = this.getCurrentUserId();
    if (userId) {
      // Clear only current user's data
      localStorage.removeItem(this.getUserKey(userId, 'token'));
      localStorage.removeItem(this.getUserKey(userId, 'isLogin'));
      localStorage.removeItem(this.getUserKey(userId, 'email'));
      localStorage.removeItem(this.getUserKey(userId, 'name'));
      localStorage.removeItem(this.getUserKey(userId, 'id'));
    }
    localStorage.removeItem('currentUserId');
    window.location.reload();
  }

  public saveToken(token: string, userId: string) {
    const key = this.getUserKey(userId, 'token');
    localStorage.removeItem(key);
    localStorage.setItem(key, token);
    localStorage.setItem('currentUserId', userId);
  }

  public isLogin(bol: any, userId: string) {
    const key = this.getUserKey(userId, 'isLogin');
    localStorage.removeItem(key);
    localStorage.setItem(key, bol);
  }

  public getIsLogin(): boolean {
    const userId = this.getCurrentUserId();
    if (!userId) return false;
    
    const key = this.getUserKey(userId, 'isLogin');
    const result = localStorage.getItem(key);
    return result === 'true';
  }

  public getToken(): string | null {
    const userId = this.getCurrentUserId();
    
    if (!userId) {
      return null;
    }
    
    const key = this.getUserKey(userId, 'token');
    const token = localStorage.getItem(key);
    return token;
  }

  public saveUser(user: any) {
    const userId = user.id || user.Id;
    if (!userId) return;

    localStorage.setItem('currentUserId', userId);
    localStorage.setItem(this.getUserKey(userId, 'email'), user.Email || user.email);
    localStorage.setItem(this.getUserKey(userId, 'name'), (user.firstName || user.FirstName) + " " + (user.lastName || user.LastName));
    localStorage.setItem(this.getUserKey(userId, 'id'), userId);
  }

  public getUser(): string | null {
    const userId = this.getCurrentUserId();
    if (!userId) return null;
    
    const key = this.getUserKey(userId, 'name');
    return localStorage.getItem(key);
  }

  public getUserEmail(): string | null {
    const userId = this.getCurrentUserId();
    if (!userId) return null;
    
    const key = this.getUserKey(userId, 'email');
    return localStorage.getItem(key);
  }

  public getUserId(): string | null {
    return this.getCurrentUserId();
  }

  // Method to switch between users
  public switchToUser(userId: string): boolean {
    const userToken = localStorage.getItem(this.getUserKey(userId, 'token'));
    const userLogin = localStorage.getItem(this.getUserKey(userId, 'isLogin'));
    
    if (userToken && userLogin === 'true') {
      localStorage.setItem('currentUserId', userId);
      return true;
    }
    return false;
  }

  // Method to get all logged-in users
  public getLoggedInUsers(): string[] {
    const users: string[] = [];
    const keys = Object.keys(localStorage);
    
    for (const key of keys) {
      if (key.startsWith('user_') && key.endsWith('_isLogin')) {
        const userId = key.replace('user_', '').replace('_isLogin', '');
        const isLogin = localStorage.getItem(key);
        if (isLogin === 'true') {
          users.push(userId);
        }
      }
    }
    
    return users;
  }

  // Method to logout specific user
  public logoutUser(userId: string): void {
    localStorage.removeItem(this.getUserKey(userId, 'token'));
    localStorage.removeItem(this.getUserKey(userId, 'isLogin'));
    localStorage.removeItem(this.getUserKey(userId, 'email'));
    localStorage.removeItem(this.getUserKey(userId, 'name'));
    localStorage.removeItem(this.getUserKey(userId, 'id'));
    
    // If this was the current user, clear currentUserId
    if (this.getCurrentUserId() === userId) {
      localStorage.removeItem('currentUserId');
    }
  }
}