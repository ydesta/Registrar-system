import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AuditLogService } from '../../../services/audit-log.service';
import {
  SuspiciousActivityDetailViewModel,
  SuspiciousActivityStatisticsViewModel,
  IpRiskAssessmentViewModel,
  UserRiskAssessmentViewModel,
  SuspiciousActivityFilterParams
} from '../../../Models/SuspiciousActivityModels';

@Component({
  selector: 'app-suspicious-activity',
  templateUrl: './suspicious-activity.component.html',
  styleUrls: ['./suspicious-activity.component.scss']
})
export class SuspiciousActivityComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Data
  suspiciousActivities: SuspiciousActivityDetailViewModel[] = [];
  statistics: SuspiciousActivityStatisticsViewModel | null = null;
  topRiskyIPs: IpRiskAssessmentViewModel[] = [];
  topRiskyUsers: UserRiskAssessmentViewModel[] = [];
  
  // Loading states
  loading = false;
  statisticsLoading = false;
  riskyIPsLoading = false;
  riskyUsersLoading = false;
  
  // Pagination
  pageIndex = 1;
  pageSize = 10;
  pageSizeOptions = [10, 20, 50, 100];
  total = 0;
  
  // Filters
  filterForm: FormGroup;
  selectedTabIndex = 0;
  
  // Date range
  dateRange: Date[] = [];
  
  constructor(
    private auditLogService: AuditLogService,
    private message: NzMessageService,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      ipAddress: [''],
      userId: ['']
    });
  }

  ngOnInit(): void {
    this.loadStatistics();
    this.loadTopRiskyIPs();
    this.loadTopRiskyUsers();
    this.loadSuspiciousActivities();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStatistics(): void {
    this.statisticsLoading = true;
    const startDate = this.dateRange.length > 0 ? this.dateRange[0] : undefined;
    const endDate = this.dateRange.length > 1 ? this.dateRange[1] : undefined;
    
    this.auditLogService.getSuspiciousActivityStatistics(startDate, endDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result.status === 'success' && result.data) {
            this.statistics = result.data;
          } else {
            this.message.warning('Failed to load statistics');
          }
          this.statisticsLoading = false;
        },
        error: (error) => {
          this.message.error('Failed to load statistics: ' + (error.message || 'Unknown error'));
          this.statisticsLoading = false;
        }
      });
  }

  loadTopRiskyIPs(): void {
    this.riskyIPsLoading = true;
    const startDate = this.dateRange.length > 0 ? this.dateRange[0] : undefined;
    const endDate = this.dateRange.length > 1 ? this.dateRange[1] : undefined;
    
    this.auditLogService.getTopRiskyIPs(10, startDate, endDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result.status === 'success' && result.data) {
            this.topRiskyIPs = result.data;
          } else {
            this.message.warning('Failed to load risky IPs');
          }
          this.riskyIPsLoading = false;
        },
        error: (error) => {
          this.message.error('Failed to load risky IPs: ' + (error.message || 'Unknown error'));
          this.riskyIPsLoading = false;
        }
      });
  }

  loadTopRiskyUsers(): void {
    this.riskyUsersLoading = true;
    const startDate = this.dateRange.length > 0 ? this.dateRange[0] : undefined;
    const endDate = this.dateRange.length > 1 ? this.dateRange[1] : undefined;
    
    this.auditLogService.getTopRiskyUsers(10, startDate, endDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result.status === 'success' && result.data) {
            this.topRiskyUsers = result.data;
          } else {
            this.message.warning('Failed to load risky users');
          }
          this.riskyUsersLoading = false;
        },
        error: (error) => {
          this.message.error('Failed to load risky users: ' + (error.message || 'Unknown error'));
          this.riskyUsersLoading = false;
        }
      });
  }

  loadSuspiciousActivities(): void {
    this.loading = true;
    
    const filterParams: SuspiciousActivityFilterParams = {
      ipAddress: this.filterForm.value.ipAddress || undefined,
      userId: this.filterForm.value.userId || undefined,
      startDate: this.dateRange.length > 0 ? this.dateRange[0] : undefined,
      endDate: this.dateRange.length > 1 ? this.dateRange[1] : undefined,
      pageIndex: this.pageIndex - 1,
      pageSize: this.pageSize
    };
    
    this.auditLogService.getSuspiciousActivityDetails(filterParams)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result.status === 'success' && result.data) {
            this.suspiciousActivities = result.data;
            // Note: Total count would need to be returned from API
            this.total = result.data.length;
          } else {
            this.suspiciousActivities = [];
            this.total = 0;
            this.message.info('No suspicious activities found');
          }
          this.loading = false;
        },
        error: (error) => {
          this.message.error('Failed to load suspicious activities: ' + (error.message || 'Unknown error'));
          this.loading = false;
        }
      });
  }

  onFilterChange(): void {
    this.pageIndex = 1;
    this.loadSuspiciousActivities();
  }

  onDateRangeChange(): void {
    this.pageIndex = 1;
    this.loadStatistics();
    this.loadTopRiskyIPs();
    this.loadTopRiskyUsers();
    this.loadSuspiciousActivities();
  }

  resetFilters(): void {
    this.filterForm.reset();
    this.dateRange = [];
    this.pageIndex = 1;
    this.loadStatistics();
    this.loadTopRiskyIPs();
    this.loadTopRiskyUsers();
    this.loadSuspiciousActivities();
  }

  onPageIndexChange(page: number): void {
    this.pageIndex = page;
    this.loadSuspiciousActivities();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageIndex = 1;
    this.loadSuspiciousActivities();
  }

  getRiskLevelColor(riskLevel: string): string {
    switch (riskLevel?.toLowerCase()) {
      case 'critical':
        return 'red';
      case 'high':
        return 'orange';
      case 'medium':
        return 'gold';
      case 'low':
        return 'green';
      default:
        return 'default';
    }
  }

  getRiskLevelBadge(riskLevel: string): string {
    switch (riskLevel?.toLowerCase()) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'processing';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  }

  viewIpDetails(ipAddress: string): void {
    this.filterForm.patchValue({ ipAddress });
    this.selectedTabIndex = 3; // Switch to details tab
    this.onFilterChange();
  }

  viewUserDetails(userId: string): void {
    this.filterForm.patchValue({ userId });
    this.selectedTabIndex = 3; // Switch to details tab
    this.onFilterChange();
  }

  getTopToolsList(): Array<{name: string, count: number}> {
    if (!this.statistics || !this.statistics.topSuspiciousTools) {
      return [];
    }
    return Object.entries(this.statistics.topSuspiciousTools)
      .map(([name, count]) => ({ name, count: count as number }))
      .sort((a, b) => b.count - a.count);
  }

  getMethodColor(method?: string): string {
    switch (method?.toUpperCase()) {
      case 'GET':
        return 'blue';
      case 'POST':
        return 'green';
      case 'PUT':
        return 'orange';
      case 'DELETE':
        return 'red';
      case 'PATCH':
        return 'purple';
      default:
        return 'default';
    }
  }

  getStatusCodeColor(statusCode: number): string {
    if (statusCode >= 200 && statusCode < 300) {
      return 'green';
    } else if (statusCode >= 300 && statusCode < 400) {
      return 'blue';
    } else if (statusCode >= 400 && statusCode < 500) {
      return 'orange';
    } else if (statusCode >= 500) {
      return 'red';
    }
    return 'default';
  }
}