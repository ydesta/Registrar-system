import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-signin-redirect-callback',
  template: `<div></div>`,
})
export class SigninRedirectCallbackComponent implements OnInit {
  public isUserAdmin: boolean = false;
  public isUserAuthenticated: boolean = false;
  public isLogin: boolean = false;
  constructor(private _authService: AuthService, private _router: Router) {}

  ngOnInit(): void {
    this._authService.finishLogin().then((_) => {
      this._router.navigate(['/'], { replaceUrl: true });
      this.isAdmin();
      localStorage.setItem('isLogin', 'true');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    });
  }
  public isAdmin = () => {
    return this._authService.checkIfUserIsAdmin().then((res) => {
      this.isUserAdmin = res;
    });
  };
}
