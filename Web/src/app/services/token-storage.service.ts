import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {
  private readonly userFields = ['token', 'isLogin', 'email', 'name', 'id'];

  private getUserKey(userId: string, key: string): string {
    return `user_${userId}_${key}`;
  }

  public getCurrentUserId(): string {
    return localStorage.getItem('currentUserId') || '';
  }

  signOut() {
    const userId = this.getCurrentUserId();
    if (userId) {
      this.clearUser(userId);
    }
    localStorage.removeItem('currentUserId');
    window.location.reload();
  }

  public saveToken(token: string, userId: string) {
    localStorage.setItem(this.getUserKey(userId, 'token'), token);
    localStorage.setItem('currentUserId', userId);
  }

  public isLogin(bol: any, userId: string) {
    localStorage.setItem(this.getUserKey(userId, 'isLogin'), bol);
  }

  public getIsLogin(): boolean {
    const userId = this.getCurrentUserId();
    return !!userId && localStorage.getItem(this.getUserKey(userId, 'isLogin')) === 'true';
  }

  public getToken(): string | null {
    const userId = this.getCurrentUserId();
    return userId ? localStorage.getItem(this.getUserKey(userId, 'token')) : null;
  }

  public saveUser(user: any) {
    const userId = user.id || user.Id;
    if (!userId) {
      return;
    }
    localStorage.setItem('currentUserId', userId);
    localStorage.setItem(this.getUserKey(userId, 'email'), user.Email || user.email);
    localStorage.setItem(
      this.getUserKey(userId, 'name'),
      `${user.firstName || user.FirstName} ${user.lastName || user.LastName}`
    );
    localStorage.setItem(this.getUserKey(userId, 'id'), userId);
  }

  public getUser(): string | null {
    const userId = this.getCurrentUserId();
    return userId ? localStorage.getItem(this.getUserKey(userId, 'name')) : null;
  }

  public getUserEmail(): string | null {
    const userId = this.getCurrentUserId();
    return userId ? localStorage.getItem(this.getUserKey(userId, 'email')) : null;
  }

  public getUserId(): string | null {
    return this.getCurrentUserId();
  }

  public switchToUser(userId: string): boolean {
    const userToken = localStorage.getItem(this.getUserKey(userId, 'token'));
    const userLogin = localStorage.getItem(this.getUserKey(userId, 'isLogin'));
    if (userToken && userLogin === 'true') {
      localStorage.setItem('currentUserId', userId);
      return true;
    }
    return false;
  }

  public getLoggedInUsers(): string[] {
    return Object.keys(localStorage)
      .filter(key => key.startsWith('user_') && key.endsWith('_isLogin'))
      .filter(key => localStorage.getItem(key) === 'true')
      .map(key => key.replace('user_', '').replace('_isLogin', ''));
  }

  public logoutUser(userId: string): void {
    this.clearUser(userId);
    if (this.getCurrentUserId() === userId) {
      localStorage.removeItem('currentUserId');
    }
  }

  private clearUser(userId: string): void {
    this.userFields.forEach(field => localStorage.removeItem(this.getUserKey(userId, field)));
  }
}
