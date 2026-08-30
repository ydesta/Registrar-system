import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { StaffService } from 'src/app/services/staff.service';
import { StaffModel } from 'src/app/Models/StaffModel';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { EMPLOYMENT_TYPE, INSTRUCTOR_TITLES } from 'src/app/common/constant';

@Component({
  selector: 'app-staff-profile',
  templateUrl: './staff-profile.component.html',
  styleUrls: ['./staff-profile.component.scss']
})
export class StaffProfileComponent implements OnInit {
  staff: StaffModel | null = null;
  loading = true;
  error = false;
  employmentTypes = EMPLOYMENT_TYPE;
  instructorTitles = INSTRUCTOR_TITLES;

  constructor(
    private router: Router,
    private staffService: StaffService,
    private notificationService: CustomNotificationService
  ) {}

  ngOnInit(): void {
    this.loadStaffProfile();
  }

  loadStaffProfile(): void {
    const userId = localStorage.getItem('userId') || localStorage.getItem('user_id');
    if (!userId) {
      this.notificationService.notification('error', 'Error', 'User ID not found');
      this.error = true;
      this.loading = false;
      return;
    }
    this.staffService.getStaffByUserId(userId).subscribe({
      next: (response: any) => {
        if (response.status === 'success' && response.data) {
          this.staff = response.data;
          this.loading = false;
          return;
        }
        this.router.navigate(['/staffs/add-staff', 'null']);
      },
      error: () => {
        this.router.navigate(['/staffs/add-staff', 'null']);
      }
    });
  }

  getEmploymentTypeName(typeId: number | string): string {
    const id = typeof typeId === 'string' ? parseInt(typeId, 10) : typeId;
    return this.employmentTypes.find(type => type.Id === id)?.Description || 'Unknown';
  }

  getTitleName(titleId: number | string): string {
    const id = typeof titleId === 'string' ? parseInt(titleId, 10) : titleId;
    return this.instructorTitles.find(t => t.Id === id)?.Description || 'Unknown';
  }

  getGenderDisplay(gender: string): string {
    return gender || 'Not specified';
  }

  formatDate(date: Date | string): string {
    if (!date) {
      return 'Not specified';
    }
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  editProfile(): void {
    if (this.staff?.id) {
      this.router.navigate(['/staffs/add-staff', this.staff.id]);
    }
  }

  goBack(): void {
    this.router.navigate(['/staffs']);
  }
}
