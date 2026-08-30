import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent {
  isUserAdmin = false;
  isUserInstructor = false;
  isUserStudent = false;
  isUserApplicant = false;
  isUserReviewer = false;
  isUserApprovedApplicant = false;
  isUserAcademicDirector = false;
  isUserReception = false;

  constructor(private authService: AuthService) {
    this.isUserAdmin = this.authService.hasRole('Administrator')
      || this.authService.hasRole('Admin')
      || this.authService.hasRole('Super Admin');
    this.isUserInstructor = this.authService.hasRole('Instructor');
    this.isUserStudent = this.authService.hasRole('Student');
    this.isUserReviewer = this.authService.hasRole('Reviewer');
    this.isUserApplicant = this.authService.hasRole('Applicant');
    this.isUserApprovedApplicant = this.authService.hasRole('ApprovedApplicant');
    this.isUserAcademicDirector = this.authService.hasRole('Academic Director');
    this.isUserReception = this.authService.hasRole('Reception');
  }
}
