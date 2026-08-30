import { Component, OnInit, OnDestroy } from '@angular/core';
import { GradeChangeRequestService } from '../../../services/grade-change-request.service';
import { GradeChangeRequestViewModel, ChangeRequestViewModel } from '../../../Models/GradeChangeRequestViewModel';
import { CustomNotificationService } from '../../../services/custom-notification.service';
import { PaginatorService, ServerPaginator } from 'src/app/reports/services/paginator.service';

@Component({
  selector: 'app-grade-change-request-list-for-approval',
  templateUrl: './grade-change-request-list-for-approval.component.html',
  styleUrls: ['./grade-change-request-list-for-approval.component.scss']
})
export class GradeChangeRequestListForApprovalComponent implements OnInit, OnDestroy {
  gradeChangeRequests: GradeChangeRequestViewModel[] = [];
  statusFilter: string = 'all';
  totalRequests = 0;
  pendingRequests = 0;
  approvedRequests = 0;
  rejectedRequests = 0;
  isDecisionModalVisible = false;
  selectedRequest: GradeChangeRequestViewModel | null = null;
  pager: ServerPaginator;

  constructor(
    private gradeChangeRequestService: GradeChangeRequestService,
    private notificationService: CustomNotificationService,
    private paginator: PaginatorService
  ) {
    this.pager = this.paginator.create();
  }

  ngOnInit(): void {
    this.pager.init(() => this.loadAllGradeChangeRequests());
    this.loadAllGradeChangeRequests();
  }

  ngOnDestroy(): void {
    this.pager.destroy();
  }

  get loading(): boolean {
    return this.pager.loading;
  }

  loadAllGradeChangeRequests(): void {
    this.pager.loading = true;
    this.gradeChangeRequestService.getAllPendingGradeChangeRequestForApprovalPaginated(this.pager.query()).subscribe({
      next: (res: any) => {
        this.gradeChangeRequests = res.data || [];
        this.pager.applyResult(res);
        this.calculateStatistics();
      },
      error: () => {
        this.gradeChangeRequests = [];
        this.pager.fail();
        this.calculateStatistics();
        this.notificationService.notification('error', 'Error', 'Failed to load grade change requests. Please try again.');
      }
    });
  }

  calculateStatistics(): void {
    this.totalRequests = this.pager.total;
    this.pendingRequests = this.pager.total;
    this.approvedRequests = 0;
    this.rejectedRequests = 0;
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

  openDecisionModal(request: GradeChangeRequestViewModel): void {
    this.selectedRequest = request;
    this.isDecisionModalVisible = true;
  }

  onModalVisibleChange(visible: boolean): void {
    this.isDecisionModalVisible = visible;
    if (!visible) {
      this.selectedRequest = null;
    }
  }

  onDecisionMade(): void {
    this.loadAllGradeChangeRequests();
  }

  approveRequest(request: GradeChangeRequestViewModel): void {
    const changeRequest: ChangeRequestViewModel = {
      status: 1,
      reviewComments: 'Approved by administrator',
      lastModifiedBy: 'Administrator'
    };

    this.pager.loading = true;
    this.gradeChangeRequestService.reviewGradeChangeRequest(request.id, changeRequest).subscribe({
      next: (success) => {
        if (success) {
          this.notificationService.notification('success', 'Success', 'Grade change request approved successfully');
          this.loadAllGradeChangeRequests();
        } else {
          this.pager.loading = false;
          this.notificationService.notification('error', 'Error', 'Failed to approve request');
        }
      },
      error: () => {
        this.pager.loading = false;
        this.notificationService.notification('error', 'Error', 'Failed to approve request. Please try again.');
      }
    });
  }

  rejectRequest(request: GradeChangeRequestViewModel): void {
    const changeRequest: ChangeRequestViewModel = {
      status: 2,
      reviewComments: 'Rejected by administrator',
      lastModifiedBy: 'Administrator'
    };

    this.pager.loading = true;
    this.gradeChangeRequestService.reviewGradeChangeRequest(request.id, changeRequest).subscribe({
      next: (success) => {
        if (success) {
          this.notificationService.notification('success', 'Success', 'Grade change request rejected successfully');
          this.loadAllGradeChangeRequests();
        } else {
          this.pager.loading = false;
          this.notificationService.notification('error', 'Error', 'Failed to reject request');
        }
      },
      error: () => {
        this.pager.loading = false;
        this.notificationService.notification('error', 'Error', 'Failed to reject request. Please try again.');
      }
    });
  }

  refreshData(): void {
    this.loadAllGradeChangeRequests();
  }

  clearFilters(): void {
    this.statusFilter = 'all';
    this.pager.searchKey = '';
    this.pager.onSearch('');
  }

  exportData(): void {
    this.notificationService.notification('info', 'Info', 'Export functionality will be implemented soon.');
  }
}
