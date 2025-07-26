import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { GradeChangeRequestService } from '../../../services/grade-change-request.service';
import { GradeChangeRequestViewModel } from '../../../Models/GradeChangeRequestViewModel';
import { CustomNotificationService } from '../../../services/custom-notification.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-manage-grade-change-request',
  templateUrl: './manage-grade-change-request.component.html',
  styleUrls: ['./manage-grade-change-request.component.scss']
})
export class ManageGradeChangeRequestComponent implements OnInit, OnDestroy {
  gradeChangeRequests: GradeChangeRequestViewModel[] = [];
  loading = false;
  staffId: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private gradeChangeRequestService: GradeChangeRequestService,
    private notificationService: CustomNotificationService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.initializeComponent();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeComponent(): void {
    // Get staff ID from localStorage (assuming it's stored there)
    this.staffId = localStorage.getItem('staffId') || localStorage.getItem('userId');
    
    if (this.staffId) {
      this.loadGradeChangeRequests();
    } else {
      this.notificationService.notification('error', 'Error', 'Staff ID not found. Please ensure you are logged in with a valid staff account.');
    }
  }

  loadGradeChangeRequests(): void {
    if (!this.staffId) {
      this.notificationService.notification('error', 'Error', 'Staff ID is required');
      return;
    }

    this.loading = true;
    this.gradeChangeRequestService.getGradeChangeRequestByStaffId(this.staffId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (requests: GradeChangeRequestViewModel[]) => {
          this.gradeChangeRequests = requests;
          this.loading = false;
          this.notificationService.notification('success', 'Success', `Loaded ${requests.length} grade change requests`);
        },
        error: (error) => {
          console.error('Error loading grade change requests:', error);
          this.loading = false;
          this.notificationService.notification('error', 'Error', 'Failed to load grade change requests. Please try again.');
        }
      });
  }

  // Method to refresh the data
  refreshData(): void {
    this.loadGradeChangeRequests();
  }

  // Get status color based on status string
  getStatusColor(status: string): string {
    switch (status) {
      case 'Pending': return 'orange';
      case 'Approved': return 'green';
      case 'Rejected': return 'red';
      default: return 'default';
    }
  }

  // Get status text based on status string (just return the status as is)
  getStatusText(status: string): string {
    return status || 'Unknown';
  }

  // View request details
  viewDetails(request: GradeChangeRequestViewModel): void {
    console.log('Viewing details for request:', request);
    // TODO: Implement modal or navigation to detail view
    this.notificationService.notification('info', 'Info', 'View details functionality will be implemented soon.');
  }

  // Review request (approve/reject)
  reviewRequest(request: GradeChangeRequestViewModel): void {
    console.log('Reviewing request:', request);
    // TODO: Implement review modal or form
    this.notificationService.notification('info', 'Info', 'Review functionality will be implemented soon.');
  }

  // Navigate to new grade change request form
  navigateToNewRequest(): void {
    this.router.navigate(['/students/grade-change-request-form']);
  }
}
