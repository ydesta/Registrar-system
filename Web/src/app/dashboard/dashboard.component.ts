import { HttpClient } from '@angular/common/http';
import { Component, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  public isUserAdmin: boolean = false;
  public isUserInstructor: boolean = false;
  public isUserStudent: boolean = false;
  public isUserApplicant: boolean = false;
  public isUserReviewer: boolean = false;
  public isUserAuthenticated: boolean = false;
  public isUserApprovedApplicant: boolean = false;
  public isUserAlreadyApplied: boolean = false;
  
  constructor(private _http: HttpClient) {
    this.getLoggedRole();
  }

  ngOnInit(): void {
   
  }

  ngOnDestroy(): void {
  }

  getLoggedRole() {
    const role = (localStorage.getItem('role') || '').replace(/"/g, '');
    const userType = (localStorage.getItem('userType') || '').replace(/"/g, '');
    const effectiveRole = userType || role;
    this.isUserAdmin = effectiveRole === 'Administrator' || effectiveRole === 'Admin' || effectiveRole === 'Super Admin';
    this.isUserInstructor = effectiveRole === 'Instructor';
    this.isUserStudent = effectiveRole === 'Student';
    this.isUserReviewer = effectiveRole === 'Reviewer';
    this.isUserApplicant = effectiveRole === 'Applicant';
    this.isUserApprovedApplicant = effectiveRole === 'ApprovedApplicant';
    
    
  }
}
