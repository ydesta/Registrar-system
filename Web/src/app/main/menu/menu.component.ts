import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
})
export class MenuComponent implements OnInit {
  isCollapsed = true;
  isLogin = false;
  currentDate = Date();
  shortUserName = '';
  userType = '';
  public isUserAdmin: boolean = false;
  public isUserAuthenticated: boolean = false;
  
  constructor(
    private _authService: AuthService,
    private _router: Router
  ) {}
  
  ngOnInit(): void {
    // Check authentication status
    this._authService.isAuthenticated().then(isAuth => {
      this.isUserAuthenticated = isAuth;
    });
    
    // Subscribe to authentication changes
    this._authService.currentUser$.subscribe(user => {
      this.isUserAuthenticated = !!user;
      if (user) {
        this.shortUserName = `${user.firstName} ${user.lastName}`;
        this.isUserAdmin = this._authService.hasRole('Administrator') || this._authService.hasRole('Admin');
      }
    });
  }

  public login = () => {
    this._router.navigate(['/accounts/login']);
  };

  public logout = () => {
    this._authService.logout();
  };

  public isAdmin = () => {
    this.isUserAdmin = this._authService.hasRole('Administrator') || this._authService.hasRole('Admin');
    return this.isUserAdmin;
  };
}
