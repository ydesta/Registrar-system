import { Injectable } from '@angular/core';
const TOKEN_KEY = 'token';
const userEmail = 'auth-email';
const userName='user-name'
const userId='user-id'

@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {
  constructor() { }

  signOut() {
    window.sessionStorage.clear();
    window.location.reload();
  }

  public saveToken(token: string) {
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.setItem(TOKEN_KEY, token);
  }
public isLogin(bol:any){
  window.sessionStorage.removeItem('isLogin');
  window.sessionStorage.setItem('isLogin',bol);
}
public getIsLogin(){
  let result= window.sessionStorage.getItem('isLogin');
  if(result){
    return true;
  }
  else{
    return false;
  }
}
  public getToken(): any {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  public saveUser(user: any) {
    window.sessionStorage.removeItem(userEmail);
    window.sessionStorage.setItem(userEmail, user.Email);
    window.sessionStorage.setItem(userName, user.firstName +" "+ user.lastName);
    window.sessionStorage.setItem(userId, user.id);
  }

  public getUser():any {
    return sessionStorage.getItem(userName);
  }
  public getUserEmail():any {
    return sessionStorage.getItem(userEmail);
  }
}