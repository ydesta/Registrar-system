import { Component, OnDestroy, OnInit } from '@angular/core';
import { NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { CgpaCreditHourLimitModel } from 'src/app/Models/CgpaCreditHourLimitModel';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { PaginatorService, ServerPaginator } from 'src/app/reports/services/paginator.service';
import { CgpaCreditHourLimitService } from '../services/cgpa-credit-hour-limit.service';
import { AddCgpaCreditHourLimitComponent } from '../add-cgpa-credit-hour-limit/add-cgpa-credit-hour-limit.component';
import { ACADEMIC_TERM_STATUS, CREDIT_HOUR_LIMIT_LEVEL } from 'src/app/common/constant';
import { StaticData } from 'src/app/admission-request/model/StaticData';

@Component({
  selector: 'app-cgpa-credit-hour-limit',
  templateUrl: './cgpa-credit-hour-limit.component.html',
  styleUrls: ['./cgpa-credit-hour-limit.component.scss']
})
export class CgpaCreditHourLimitComponent implements OnInit, OnDestroy {
  limits: CgpaCreditHourLimitModel[] = [];
  pager: ServerPaginator;
  reqId = '';
  isEnabled = false;
  settingLoading = false;
  filterAcademicTerm: number | null = 1;
  filterYear: number | null = new Date().getFullYear();
  filterLimitLevel: number | null = null;
  termList: StaticData[] = [];
  levelList: StaticData[] = [];
  yearOptions: number[] = [];

  constructor(
    private limitService: CgpaCreditHourLimitService,
    private _customNotificationService: CustomNotificationService,
    private _modal: NzModalService,
    private paginator: PaginatorService
  ) {
    this.pager = this.paginator.create();
  }

  ngOnInit(): void {
    this.termList = ACADEMIC_TERM_STATUS.map(x => ({ Id: x.Id, Description: x.Description }));
    this.levelList = CREDIT_HOUR_LIMIT_LEVEL.map(x => ({ Id: x.Id, Description: x.Description }));
    const current = new Date().getFullYear();
    this.yearOptions = Array.from({ length: 11 }, (_, i) => current - 5 + i);
    this.loadSetting();
    this.pager.init(() => this.fetchList());
    this.fetchList();
  }

  ngOnDestroy(): void {
    this.pager.destroy();
  }

  getTermLabel(id: number): string {
    if (id == null) {
      return '-';
    }
    return this.termList.find(x => x.Id === id)?.Description || String(id);
  }

  getLevelLabel(id: number): string {
    return this.levelList.find(x => x.Id === id)?.Description || 'Term / Year';
  }

  studentDisplay(data: CgpaCreditHourLimitModel): string {
    if (!data?.student && !data?.studentId) {
      return '-';
    }
    const code = data.student?.studentId || '';
    const name = [data.student?.firstName, data.student?.fatherName, data.student?.grandFatherName]
      .filter(Boolean)
      .join(' ');
    return `${code} ${name}`.trim() || data.studentId || '-';
  }

  onFilterChange(): void {
    this.loadSetting();
    this.pager.pageIndex = 1;
    this.fetchList();
  }

  loadSetting() {
    if (!this.filterAcademicTerm || !this.filterYear) {
      this.isEnabled = false;
      return;
    }
    this.settingLoading = true;
    this.limitService.getSetting(this.filterAcademicTerm, this.filterYear).subscribe({
      next: (res: any) => {
        this.isEnabled = !!res?.data?.isEnabled;
        this.settingLoading = false;
      },
      error: () => {
        this.settingLoading = false;
      }
    });
  }

  onEnabledChange(enabled: boolean) {
    if (!this.filterAcademicTerm || !this.filterYear) {
      this.isEnabled = !enabled;
      this._customNotificationService.notification('error', 'Error', 'Select Academic Term and Year first.');
      return;
    }
    this.settingLoading = true;
    this.limitService.updateSetting(this.filterAcademicTerm, this.filterYear, enabled).subscribe({
      next: (res: any) => {
        this.isEnabled = !!res?.data?.isEnabled;
        this.settingLoading = false;
        this.fetchList();
        this._customNotificationService.notification(
          'success',
          'Success',
          this.isEnabled
            ? 'CGPA credit hour limits are now enforced for this term/year.'
            : 'CGPA credit hour limits are disabled for this term/year. Students may register without a max credit cap.'
        );
      },
      error: () => {
        this.isEnabled = !enabled;
        this.settingLoading = false;
        this._customNotificationService.notification('error', 'Error', 'Failed to update setting.');
      }
    });
  }

  fetchList() {
    this.pager.loading = true;
    this.limitService.getListPaginated(this.pager.query({
      academicTerm: this.filterAcademicTerm,
      year: this.filterYear,
      limitLevel: this.filterLimitLevel
    })).subscribe({
      next: (res: any) => {
        this.limits = res?.data || [];
        this.pager.applyResult(res);
      },
      error: () => {
        this.limits = [];
        this.pager.fail();
      }
    });
  }

  showDeleteConfirm(id: string): void {
    this.reqId = id;
    this._modal.confirm({
      nzTitle: 'Are you sure you want to delete this CGPA credit hour limit?',
      nzOkText: 'Yes',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this.limitService.delete(this.reqId).subscribe((res: any) => {
          this.fetchList();
          this.loadSetting();
          if (res.status === 'success') {
            this._customNotificationService.notification('success', 'Success', res.data);
          } else {
            this._customNotificationService.notification('error', 'Error', res.data);
          }
        });
      },
      nzCancelText: 'No'
    });
  }

  openModal(): void {
    const modal: NzModalRef = this._modal.create({
      nzTitle: 'CGPA Credit Hour Limit',
      nzContent: AddCgpaCreditHourLimitComponent,
      nzComponentParams: {
        defaultAcademicTerm: this.filterAcademicTerm,
        defaultYear: this.filterYear
      },
      nzMaskClosable: false,
      nzFooter: null,
      nzWidth: 640,
      nzBodyStyle: { padding: '20px 24px 16px' }
    });
    modal.afterClose.subscribe(() => {
      this.fetchList();
      this.loadSetting();
    });
  }

  editModal(limit: CgpaCreditHourLimitModel): void {
    const modal: NzModalRef = this._modal.create({
      nzTitle: 'Edit CGPA Credit Hour Limit',
      nzContent: AddCgpaCreditHourLimitComponent,
      nzComponentParams: { limit },
      nzMaskClosable: false,
      nzFooter: null,
      nzWidth: 640,
      nzBodyStyle: { padding: '20px 24px 16px' }
    });
    modal.afterClose.subscribe(() => {
      this.fetchList();
      this.loadSetting();
    });
  }
}
