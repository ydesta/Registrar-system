import { AuthService } from '../services/auth.service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  templateUrl: './unauthorized.component.html',
  styleUrls: ['./unauthorized.component.scss'],
})
export class UnauthorizedComponent implements OnInit {
  public isUserAuthenticated: boolean = false;

  constructor(
    private _authService: AuthService,
    private _router: Router
  ) {
    // Subscribe to authentication changes
    this._authService.currentUser$.subscribe(user => {
      this.isUserAuthenticated = !!user;
    });
  }

  ngOnInit(): void {
    // Check authentication status
    this._authService.isAuthenticated().then(isAuth => {
      this.isUserAuthenticated = isAuth;
    });
  }

  public login = () => {
    this._router.navigate(['/accounts/login']);
  };

  public logout = () => {
    this._authService.logout();
  };
}
