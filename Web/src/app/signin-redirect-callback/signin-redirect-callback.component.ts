import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-signin-redirect-callback',
  template: `<div></div>`,
})
export class SigninRedirectCallbackComponent implements OnInit {
  constructor(private _authService: AuthService, private _router: Router) {}

  ngOnInit(): void {
    this._authService.finishLogin().then(() => {
      localStorage.setItem('isLogin', 'true');
      this._router.navigate(['/'], { replaceUrl: true }).then(() => {
        window.location.reload();
      });
    });
  }
}
