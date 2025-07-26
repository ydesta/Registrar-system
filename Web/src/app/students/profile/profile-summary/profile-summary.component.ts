import { Component, OnInit } from '@angular/core';
import { StudentProfileViewModel } from '../../models/student-profile-view-model.model';
import { StudentService } from '../../services/student.service';
import { environment } from 'src/environments/environment';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-profile-summary',
  templateUrl: './profile-summary.component.html',
  styleUrls: ['./profile-summary.component.scss'],
})
export class ProfileSummaryComponent implements OnInit {
  studentProfile: StudentProfileViewModel | null = null;
  profilePicture: string = '';
  userId: string | null = null;
  initials: string = '';
  isLoading: boolean = false;
  error: string | null = null;

  constructor(private studentService: StudentService) {
    this.userId = localStorage.getItem('userId');
  }

  ngOnInit(): void {
    this.getStudentProfile();
  }

  getStudentProfile(): void {
    if (!this.userId) {
      this.error = 'User ID not found. Please log in again.';
      return;
    }

    this.isLoading = true;
    this.error = null;

    this.studentService
      .getStudentProfileByApplicationId(this.userId)
      .pipe(
        catchError((err) => {
          this.error = 'Failed to load profile. Please try again later.';
          console.error('Error loading profile:', err);
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe((res) => {
        if (res) {
          this.studentProfile = res;
          this.profilePicture = res.photoUrl;
          if (this.profilePicture) {
            this.profilePicture = res.photoUrl
              ? environment.fileUrl + '/Resources/profile/' + this.profilePicture
              : '';
          }

          this.initials = this.getInitials(this.studentProfile.fullName);
        }
      });
  }
  isValidProfilePicture(url: string | null): boolean {
    return url !== null && !url.includes('/null');
  }
  getProfilePictureUrl(photoUrl: string | null | undefined): string {
    if (!photoUrl) {
      return this.getDefaultImage();
    }
    return `${environment.fileUrl}/Resources/profile/${photoUrl}`;
  }

  getDefaultImage(): string {
    return 'assets/images/profile.png';
  }

  getInitials(fullName: string): string {
    if (!fullName) return '';
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || '';
    const fatherName = nameParts[1] || '';
    return firstName.charAt(0).toUpperCase() + fatherName.charAt(0).toUpperCase(); // D + B
  }
}
