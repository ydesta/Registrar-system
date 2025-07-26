import { Component, OnInit, OnDestroy } from '@angular/core';
import { GradeChangeRequestService } from '../../../services/grade-change-request.service';
import { GradeChangeRequestViewModel, ChangeRequestViewModel } from '../../../Models/GradeChangeRequestViewModel';
import { CustomNotificationService } from '../../../services/custom-notification.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-grade-change-request-list-for-approval',
  templateUrl: './grade-change-request-list-for-approval.component.html',
  styleUrls: ['./grade-change-request-list-for-approval.component.scss']
})
export class GradeChangeRequestListForApprovalComponent implements OnInit, OnDestroy {
  gradeChangeRequests: GradeChangeRequestViewModel[] = [];
  loading = false;
  private destroy$ = new Subject<void>();

  // Filter properties
  statusFilter: string = 'all';
  searchTerm: string = '';

  // Statistics
  totalRequests = 0;
  pendingRequests = 0;
  approvedRequests = 0;
  rejectedRequests = 0;

  // Modal properties
  isDecisionModalVisible = false;
  selectedRequest: GradeChangeRequestViewModel | null = null;

  constructor(
    private gradeChangeRequestService: GradeChangeRequestService,
    private notificationService: CustomNotificationService
  ) { }

  ngOnInit(): void {
    this.loadAllGradeChangeRequests();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAllGradeChangeRequests(): void {
    this.loading = true;
    this.gradeChangeRequestService.getAllPendingGradeChangeRequestForApproval()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (requests: GradeChangeRequestViewModel[]) => {
          this.gradeChangeRequests = requests;
          this.calculateStatistics();
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

  calculateStatistics(): void {
    this.totalRequests = this.gradeChangeRequests.length;
    this.pendingRequests = this.gradeChangeRequests.filter(req => req.status === 'Pending').length;
    this.approvedRequests = this.gradeChangeRequests.filter(req => req.status === 'Approved').length;
    this.rejectedRequests = this.gradeChangeRequests.filter(req => req.status === 'Rejected').length;
  }

  getFilteredRequests(): GradeChangeRequestViewModel[] {
    let filtered = this.gradeChangeRequests;

    // Filter by status
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === this.statusFilter);
    }

    // Filter by search term
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(req => 
        req.fullName?.toLowerCase().includes(search) ||
        req.course?.toLowerCase().includes(search) ||
        req.instructorName?.toLowerCase().includes(search) ||
        req.previousGrade?.toLowerCase().includes(search) ||
        req.newGrade?.toLowerCase().includes(search)
      );
    }

    return filtered;
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

  // Get status text based on status string
  getStatusText(status: string): string {
    return status || 'Unknown';
  }

  // View request details
  viewDetails(request: GradeChangeRequestViewModel): void {
    console.log('Viewing details for request:', request);
    this.notificationService.notification('info', 'Info', 'View details functionality will be implemented soon.');
  }

  // Open decision modal
  openDecisionModal(request: GradeChangeRequestViewModel): void {
    this.selectedRequest = request;
    this.isDecisionModalVisible = true;
  }

  // Handle modal visibility change
  onModalVisibleChange(visible: boolean): void {
    this.isDecisionModalVisible = visible;
    if (!visible) {
      this.selectedRequest = null;
    }
  }

  // Handle decision made
  onDecisionMade(): void {
    this.loadAllGradeChangeRequests(); // Reload data after decision
  }

  // Approve request
  approveRequest(request: GradeChangeRequestViewModel): void {
    const changeRequest: ChangeRequestViewModel = {
      status: 1, // Approved
      reviewComments: 'Approved by administrator',
      lastModifiedBy: 'Administrator'
    };

    this.loading = true;
    this.gradeChangeRequestService.reviewGradeChangeRequest(request.id, changeRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (success) => {
          if (success) {
            this.notificationService.notification('success', 'Success', 'Grade change request approved successfully');
            this.loadAllGradeChangeRequests(); // Reload to get updated data
          } else {
            this.notificationService.notification('error', 'Error', 'Failed to approve request');
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error approving request:', error);
          this.notificationService.notification('error', 'Error', 'Failed to approve request. Please try again.');
          this.loading = false;
        }
      });
  }

  // Reject request
  rejectRequest(request: GradeChangeRequestViewModel): void {
    const changeRequest: ChangeRequestViewModel = {
      status: 2, // Rejected
      reviewComments: 'Rejected by administrator',
      lastModifiedBy: 'Administrator'
    };

    this.loading = true;
    this.gradeChangeRequestService.reviewGradeChangeRequest(request.id, changeRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (success) => {
          if (success) {
            this.notificationService.notification('success', 'Success', 'Grade change request rejected successfully');
            this.loadAllGradeChangeRequests(); // Reload to get updated data
          } else {
            this.notificationService.notification('error', 'Error', 'Failed to reject request');
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error rejecting request:', error);
          this.notificationService.notification('error', 'Error', 'Failed to reject request. Please try again.');
          this.loading = false;
        }
      });
  }

  // Refresh data
  refreshData(): void {
    this.loadAllGradeChangeRequests();
  }

  // Clear filters
  clearFilters(): void {
    this.statusFilter = 'all';
    this.searchTerm = '';
  }

  // Export data (placeholder for future implementation)
  exportData(): void {
    this.notificationService.notification('info', 'Info', 'Export functionality will be implemented soon.');
  }
}
