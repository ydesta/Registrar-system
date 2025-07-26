import { AuthService } from '../services/auth.service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  public isUserAuthenticated: boolean = false;
  public currentUser: any = null;
  public isUserApplicant: boolean = false;

  constructor(
    private _authService: AuthService,
    private _router: Router
  ) {}

  ngOnInit(): void {
    // Check authentication status
    this._authService.isAuthenticated().then(isAuth => {
      this.isUserAuthenticated = isAuth;
      this.currentUser = this._authService.getCurrentUser();
      
      // Check if user is applicant
      this.isUserApplicant = this._authService.hasRole('Applicant') || 
                            localStorage.getItem('role') === '"Applicant"';
    });
    
    // Subscribe to authentication changes
    this._authService.currentUser$.subscribe(user => {
      this.isUserAuthenticated = !!user;
      this.currentUser = user;
      this.isUserApplicant = this._authService.hasRole('Applicant') || 
                            localStorage.getItem('role') === '"Applicant"';
    });
  }

  public login = () => {
    this._router.navigate(['/accounts/login']);
  };

  public logout = () => {
    this._authService.logout();
  };
}
