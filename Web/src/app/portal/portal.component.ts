import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-portal',
  templateUrl: './portal.component.html',
  styleUrls: ['./portal.component.scss']
})
export class PortalComponent implements OnInit {
  public isUserApplicant: boolean = false;
  public isAuthenticated: boolean = false;
  public currentUser: any = null;
  currentYear: number = new Date().getFullYear();

  constructor(
    private _authService: AuthService,
    private _router: Router
  ) {
    
   }

  ngOnInit(): void {
    this._authService.isAuthenticated().then(isAuth => {
      this.isAuthenticated = isAuth;
      this.currentUser = this._authService.getCurrentUser();
      if (localStorage.getItem('role') == '"Applicant"') {
        this.isUserApplicant = true;
      }
    });
  }

  public login = () => {
    // Use the new API-based login
    this._router.navigate(['/accounts/login']);
  };

  public register = () => {
    this._router.navigate(['/accounts/register']);
  };

  public logout = () => {
    this._authService.logout();
  };

  public goToHome = () => {
    this._router.navigate(['/portal']);
  };

  public goToDashboard = () => {
    this._router.navigate(['/dashboard']);
  };
} 