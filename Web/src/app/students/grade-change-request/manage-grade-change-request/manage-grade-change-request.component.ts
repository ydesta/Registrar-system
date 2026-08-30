import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { GradeChangeRequestService } from '../../../services/grade-change-request.service';
import { GradeChangeRequestViewModel } from '../../../Models/GradeChangeRequestViewModel';
import { CustomNotificationService } from '../../../services/custom-notification.service';
import { PaginatorService, ServerPaginator } from 'src/app/reports/services/paginator.service';

@Component({
  selector: 'app-manage-grade-change-request',
  templateUrl: './manage-grade-change-request.component.html',
  styleUrls: ['./manage-grade-change-request.component.scss']
})
export class ManageGradeChangeRequestComponent implements OnInit, OnDestroy {
  gradeChangeRequests: GradeChangeRequestViewModel[] = [];
  staffId: string | null = null;
  pager: ServerPaginator;

  constructor(
    private gradeChangeRequestService: GradeChangeRequestService,
    private notificationService: CustomNotificationService,
    private router: Router,
    private paginator: PaginatorService
  ) {
    this.pager = this.paginator.create();
  }

  ngOnInit(): void {
    this.staffId = localStorage.getItem('staffId') || localStorage.getItem('userId');
    if (this.staffId) {
      this.pager.init(() => this.loadGradeChangeRequests());
      this.loadGradeChangeRequests();
    } else {
      this.notificationService.notification('error', 'Error', 'Staff ID not found. Please ensure you are logged in with a valid staff account.');
    }
  }

  ngOnDestroy(): void {
    this.pager.destroy();
  }

  get loading(): boolean {
    return this.pager.loading;
  }

  loadGradeChangeRequests(): void {
    if (!this.staffId) {
      this.notificationService.notification('error', 'Error', 'Staff ID is required');
      return;
    }

    this.pager.loading = true;
    this.gradeChangeRequestService.getGradeChangeRequestByStaffIdPaginated(this.staffId, this.pager.query()).subscribe({
      next: (res: any) => {
        this.gradeChangeRequests = res.data || [];
        this.pager.applyResult(res);
      },
      error: () => {
        this.gradeChangeRequests = [];
        this.pager.fail();
        this.notificationService.notification('error', 'Error', 'Failed to load grade change requests. Please try again.');
      }
    });
  }

  refreshData(): void {
    this.loadGradeChangeRequests();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Pending': return 'orange';
      case 'Approved': return 'green';
      case 'Rejected': return 'red';
      default: return 'default';
    }
  }

  getStatusText(status: string): string {
    return status || 'Unknown';
  }

  viewDetails(request: GradeChangeRequestViewModel): void {
    this.notificationService.notification('info', 'Info', 'View details functionality will be implemented soon.');
  }

  reviewRequest(request: GradeChangeRequestViewModel): void {
    this.notificationService.notification('info', 'Info', 'Review functionality will be implemented soon.');
  }

  navigateToNewRequest(): void {
    this.router.navigate(['/students/grade-change-request-form']);
  }
}
