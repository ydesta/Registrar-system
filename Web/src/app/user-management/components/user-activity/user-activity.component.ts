import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { UserManagementService } from '../../../services/user-management.service';
import { AuthService } from '../../../services/auth.service';
import {
  ActivityFilters,
  ActivityFilterParams,
  ActivityLogResponse,
  UserActivity,
  ACTIVITY_TYPE_OPTIONS
} from './user-activity.interface';

@Component({
  selector: 'app-user-activity',
  templateUrl: './user-activity.component.html',
  styleUrls: ['./user-activity.component.scss']
})
export class UserActivityComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  activities: UserActivity[] = [];
  loading = false;
  pageIndex = 1;
  pageSize = 10;
  pageSizeOption = [5, 10, 15, 25, 50, 100];
  total = 0;
  filters: ActivityFilters = {
    userEmail: '',
    activityType: '',
    dateRange: []
  };
  activityTypeOptions = ACTIVITY_TYPE_OPTIONS;

  constructor(
    private userManagementService: UserManagementService,
    private message: NzMessageService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadActivities();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  checkUserAccess(): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.message.error('User not authenticated');
      return false;
    }
    return !!currentUser.roles?.some(role =>
      ['Admin', 'Super Admin', 'Administrator'].includes(role)
    );
  }

  loadActivities(): void {
    this.loading = true;
    const params: ActivityFilterParams = {
      page: this.pageIndex,
      pageSize: this.pageSize
    };
    if (this.filters.userEmail) {
      params.userEmail = this.filters.userEmail;
    }
    if (this.filters.activityType) {
      params.action = this.filters.activityType;
    }
    if (this.filters.dateRange?.length === 2) {
      params.startDate = this.filters.dateRange[0]?.toISOString();
      params.endDate = this.filters.dateRange[1]?.toISOString();
    }
    this.userManagementService.getAllUserActivity(params).pipe(takeUntil(this.destroy$)).subscribe({
      next: (result: ActivityLogResponse) => {
        this.activities = result.activities || [];
        this.total = result.total || 0;
        if (!this.activities.length) {
          this.message.info('No activity logs found');
        }
        this.loading = false;
      },
      error: (error) => {
        if (error.status === 403) {
          this.message.error('Access denied. You do not have permission to view activity logs.');
        } else if (error.status === 401) {
          this.message.error('Authentication required. Please log in again.');
        } else {
          this.message.error('Failed to load activities: ' + (error.message || 'Unknown error'));
        }
        this.loading = false;
      }
    });
  }

  onFilterChange(): void {
    this.pageIndex = 1;
    this.loadActivities();
  }

  resetFilters(): void {
    this.filters = {
      userEmail: '',
      activityType: '',
      dateRange: []
    };
    this.pageIndex = 1;
    this.loadActivities();
  }

  hasActiveFilters(): boolean {
    return !!(this.filters.userEmail || this.filters.activityType || this.filters.dateRange?.length === 2);
  }

  onPageIndexChange(page: number): void {
    this.pageIndex = page;
    this.loadActivities();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageIndex = 1;
    this.loadActivities();
  }

  getActivityColor(activityType: string): string {
    const activityOption = this.activityTypeOptions.find(option =>
      option.value.toLowerCase() === activityType.toLowerCase()
    );
    return activityOption?.color || 'default';
  }
}
