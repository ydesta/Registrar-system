import { Component, OnDestroy, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { AcademicTermModel } from 'src/app/Models/AcademicTermModel';
import { BaseModel } from 'src/app/Models/BaseMode';
import { PaginatorService, ServerPaginator } from 'src/app/reports/services/paginator.service';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { ACADEMIC_TERM_STATUS, ACADEMIC_YEAR_NUMBER_STATUS } from 'src/app/common/constant';

@Component({
  selector: 'app-academic-term',
  templateUrl: './academic-term.component.html',
  styleUrls: ['./academic-term.component.scss'],
})
export class AcademicTermComponent implements OnInit, OnDestroy {
  academicTerms: AcademicTermModel[] = [];
  filteredAcademicTerms: AcademicTermModel[] = [];
  termStatusList = ACADEMIC_TERM_STATUS;
  academicYearList = ACADEMIC_YEAR_NUMBER_STATUS;
  expandSet = new Set<number>();
  updatingVisibilityId: number | null = null;
  pager: ServerPaginator;

  constructor(
    private _customNotificationService: CustomNotificationService,
    private _crudService: CrudService,
    private modal: NzModalService,
    private paginator: PaginatorService
  ) {
    this.pager = this.paginator.create();
  }

  ngOnInit(): void {
    this.pager.init(() => this.fetchAcademicTerms());
    this.fetchAcademicTerms();
  }

  ngOnDestroy(): void {
    this.pager.destroy();
  }

  fetchAcademicTerms(): void {
    this.pager.loading = true;
    const query = this.pager.query(undefined, this.resolveSearchKey());
    this._crudService
      .getPaginated(`/AcademicTerms`, query)
      .pipe(
        catchError(() => {
          this._customNotificationService.notification(
            'error',
            'Error',
            'Failed to fetch academic terms. Please try again.'
          );
          this.pager.fail();
          return of({ data: [], totalRowCount: 0 } as any);
        }),
        finalize(() => {
          this.pager.loading = false;
        })
      )
      .subscribe((res: any) => {
        this.academicTerms = res?.data || [];
        this.filteredAcademicTerms = this.academicTerms;
        this.pager.applyResult(res);
      });
  }

  private resolveSearchKey(): string {
    const raw = this.paginator.sanitizeSearchKey(this.pager.searchKey);
    if (!raw) {
      return '';
    }
    const matchedTerm = this.termStatusList.find(t =>
      t.Description.toLowerCase().includes(raw.toLowerCase())
    );
    if (matchedTerm && isNaN(Number(raw))) {
      return String(matchedTerm.Id);
    }
    return raw;
  }

  getTermName(termId: number): string {
    const term = this.termStatusList.find(t => t.Id === termId);
    return term ? term.Description : `Term ${termId}`;
  }

  getAcademicTermName(academicTerm: number): string {
    const term = this.termStatusList.find(t => t.Id === academicTerm);
    return term ? term.Description : `Term ${academicTerm}`;
  }

  getAcademicYearName(academicYear: number): string {
    const year = this.academicYearList.find(y => y.Id === academicYear);
    return year ? year.Description : `Year ${academicYear}`;
  }

  onExpandChange(id: number | undefined, checked: boolean): void {
    if (id === undefined) return;
    if (checked) {
      this.expandSet.add(id);
    } else {
      this.expandSet.delete(id);
    }
  }

  trackById(index: number, item: AcademicTermModel): number | undefined {
    return item.id;
  }

  trackByBatchTermId(index: number, item: any): number {
    return item.id;
  }

  onVisibilityToggle(
    term: AcademicTermModel,
    field: 'showRegular' | 'showAdd' | 'showAssessment' | 'showEquivalent',
    value: boolean
  ): void {
    if (!term?.id || this.updatingVisibilityId === term.id) {
      return;
    }

    const previousValue = term[field] !== false;
    if (previousValue === value) {
      return;
    }

    term[field] = value;
    this.updatingVisibilityId = term.id;

    const payload = {
      termId: term.termId,
      year: term.year,
      startDate: term.startDate,
      endDate: term.endDate,
      isCurrentTerm: term.isCurrentTerm,
      showRegular: term.showRegular !== false,
      showAdd: term.showAdd !== false,
      showAssessment: term.showAssessment !== false,
      showEquivalent: term.showEquivalent !== false
    };

    this._crudService
      .update('/AcademicTerms', term.id, payload)
      .pipe(
        catchError((error) => {
          term[field] = previousValue;
          this._customNotificationService.notification(
            'error',
            'Error',
            error?.error?.data || 'Failed to update registration visibility.'
          );
          return of({ status: 'error', data: 'Update failed' });
        }),
        finalize(() => {
          this.updatingVisibilityId = null;
        })
      )
      .subscribe((res: BaseModel<any>) => {
        if (res.status === 'success') {
          this._customNotificationService.notification(
            'success',
            'Success',
            'Registration visibility updated.'
          );
        } else if (res.status !== 'error') {
          term[field] = previousValue;
          this._customNotificationService.notification(
            'error',
            'Error',
            res.data || res.error || 'Failed to update registration visibility.'
          );
        }
      });
  }

  showDeleteConfirm(id: number | undefined): void {
    if (!id) {
      return;
    }

    this.modal.confirm({
      nzTitle: 'Delete Academic Term',
      nzContent: 'Are you sure you want to delete this academic term? This action cannot be undone.',
      nzOkText: 'Yes, Delete',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Cancel',
      nzOnOk: () => {
        this.deleteAcademicTerm(id);
      },
    });
  }

  private deleteAcademicTerm(id: number): void {
    this._crudService
      .delete('/AcademicTerms', id)
      .pipe(
        catchError((error) => {
          this._customNotificationService.notification(
            'error',
            'Error',
            error?.error?.data || 'Failed to delete academic term. Please try again.'
          );
          return of({ status: 'error', data: 'Delete operation failed' });
        })
      )
      .subscribe((res: BaseModel<any>) => {
        if (res.status === 'success') {
          this._customNotificationService.notification(
            'success',
            'Success',
            res.data || 'Academic term deleted successfully.'
          );
          this.fetchAcademicTerms();
        } else {
          this._customNotificationService.notification(
            'error',
            'Error',
            res.data || res.error || 'Failed to delete academic term.'
          );
        }
      });
  }
}
