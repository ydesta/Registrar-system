import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AuditLogService } from '../../../services/audit-log.service';
import {
  SuspiciousActivityDetailViewModel,
  SuspiciousActivityStatisticsViewModel,
  IpRiskAssessmentViewModel,
  UserRiskAssessmentViewModel
} from '../../../Models/SuspiciousActivityModels';
import { PaginatorService, ServerPaginator } from 'src/app/reports/services/paginator.service';

@Component({
  selector: 'app-suspicious-activity',
  templateUrl: './suspicious-activity.component.html',
  styleUrls: ['./suspicious-activity.component.scss']
})
export class SuspiciousActivityComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  suspiciousActivities: SuspiciousActivityDetailViewModel[] = [];
  statistics: SuspiciousActivityStatisticsViewModel | null = null;
  topRiskyIPs: IpRiskAssessmentViewModel[] = [];
  topRiskyUsers: UserRiskAssessmentViewModel[] = [];
  loading = false;
  statisticsLoading = false;
  riskyIPsLoading = false;
  riskyUsersLoading = false;
  searchKey = '';
  pager: ServerPaginator;
  filterForm: FormGroup;
  selectedTabIndex = 0;
  dateRange: Date[] = [];

  constructor(
    private auditLogService: AuditLogService,
    private message: NzMessageService,
    private fb: FormBuilder,
    private paginator: PaginatorService
  ) {
    this.pager = this.paginator.create();
    this.filterForm = this.fb.group({
      ipAddress: [''],
      userId: ['']
    });
  }

  ngOnInit(): void {
    this.pager.init(() => this.loadSuspiciousActivities(false));
    this.loadStatistics();
    this.loadTopRiskyIPs();
    this.loadTopRiskyUsers();
    this.loadSuspiciousActivities(false);
  }

  ngOnDestroy(): void {
    this.pager.destroy();
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStatistics(): void {
    this.statisticsLoading = true;
    const { startDate, endDate } = this.range();
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
    const { startDate, endDate } = this.range();
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
    const { startDate, endDate } = this.range();
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

  loadSuspiciousActivities(resetPage = true): void {
    if (resetPage) {
      this.pager.pageIndex = 1;
    }
    this.loading = true;
    this.pager.loading = true;
    const ipAddress = this.filterForm.value.ipAddress || '';
    const userId = this.filterForm.value.userId || '';
    const startDate = this.dateRange.length > 0 ? this.dateRange[0].toISOString() : '';
    const endDate = this.dateRange.length > 1 ? this.dateRange[1].toISOString() : '';
    this.auditLogService.getSuspiciousActivityDetailsPaginated(
      this.pager.query({ ipAddress, userId, startDate, endDate })
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: (result) => {
        this.suspiciousActivities = result?.data || [];
        this.pager.applyResult(result);
        this.loading = false;
      },
      error: () => {
        this.suspiciousActivities = [];
        this.pager.fail();
        this.loading = false;
        this.message.error('Failed to load suspicious activities');
      }
    });
  }

  search(): void {
    this.pager.onSearch(this.searchKey);
  }

  onFilterChange(): void {
    this.pager.onFilterChange();
  }

  onDateRangeChange(): void {
    this.reloadAll(true);
  }

  resetFilters(): void {
    this.filterForm.reset();
    this.dateRange = [];
    this.searchKey = '';
    this.pager.searchKey = '';
    this.reloadAll(true);
  }

  onPageIndexChange(page: number): void {
    this.pager.onPageIndexChange(page);
  }

  onPageSizeChange(size: number): void {
    this.pager.onPageSizeChange(size);
  }

  getRiskLevelColor(riskLevel: string): string {
    switch (riskLevel?.toLowerCase()) {
      case 'critical': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'gold';
      case 'low': return 'green';
      default: return 'default';
    }
  }

  getRiskLevelBadge(riskLevel: string): string {
    switch (riskLevel?.toLowerCase()) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'processing';
      case 'low': return 'success';
      default: return 'default';
    }
  }

  viewIpDetails(ipAddress: string): void {
    this.filterForm.patchValue({ ipAddress });
    this.selectedTabIndex = 3;
    this.onFilterChange();
  }

  viewUserDetails(userId: string): void {
    this.filterForm.patchValue({ userId });
    this.selectedTabIndex = 3;
    this.onFilterChange();
  }

  getTopToolsList(): Array<{name: string, count: number}> {
    if (!this.statistics?.topSuspiciousTools) {
      return [];
    }
    return Object.entries(this.statistics.topSuspiciousTools)
      .map(([name, count]) => ({ name, count: count as number }))
      .sort((a, b) => b.count - a.count);
  }

  getMethodColor(method?: string): string {
    switch (method?.toUpperCase()) {
      case 'GET': return 'blue';
      case 'POST': return 'green';
      case 'PUT': return 'orange';
      case 'DELETE': return 'red';
      case 'PATCH': return 'purple';
      default: return 'default';
    }
  }

  getStatusCodeColor(statusCode: number): string {
    if (statusCode >= 200 && statusCode < 300) return 'green';
    if (statusCode >= 300 && statusCode < 400) return 'blue';
    if (statusCode >= 400 && statusCode < 500) return 'orange';
    if (statusCode >= 500) return 'red';
    return 'default';
  }

  private range(): { startDate?: Date; endDate?: Date } {
    return {
      startDate: this.dateRange.length > 0 ? this.dateRange[0] : undefined,
      endDate: this.dateRange.length > 1 ? this.dateRange[1] : undefined
    };
  }

  private reloadAll(resetPage: boolean): void {
    this.pager.pageIndex = 1;
    this.loadStatistics();
    this.loadTopRiskyIPs();
    this.loadTopRiskyUsers();
    this.loadSuspiciousActivities(resetPage);
  }
}
