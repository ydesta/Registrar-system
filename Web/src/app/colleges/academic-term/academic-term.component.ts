import { Component, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { BaseModel } from 'src/app/Models/BaseMode';
import { AcademicTermModel } from 'src/app/Models/AcademicTermModel';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { ACADEMIC_TERM_STATUS, ACADEMIC_YEAR_NUMBER_STATUS } from 'src/app/common/constant';

@Component({
  selector: 'app-academic-term',
  templateUrl: './academic-term.component.html',
  styleUrls: ['./academic-term.component.scss'],
})
export class AcademicTermComponent implements OnInit {
  academicTerms: AcademicTermModel[] = [];
  filteredAcademicTerms: AcademicTermModel[] = [];
  checked = false;
  isLoading = false;
  isExporting = false;
  termStatusList = ACADEMIC_TERM_STATUS;
  academicYearList = ACADEMIC_YEAR_NUMBER_STATUS;
  searchTerm = '';
  expandSet = new Set<number>();
  
  // Pagination properties
  pageIndex = 1;
  pageSize = 10;
  total = 0;
  pageSizeOptions = [10, 20, 50, 100];

  constructor(
    private _customNotificationService: CustomNotificationService,
    private _crudService: CrudService,
    private modal: NzModalService
  ) {}

  ngOnInit(): void {
    this.fetchAcademicTerms();
  }

  fetchAcademicTerms(): void {
    this.isLoading = true;
    this._crudService
      .getList('/AcademicTerms')
      .pipe(
        catchError((error) => {
          this._customNotificationService.notification(
            'error',
            'Error',
            'Failed to fetch academic terms. Please try again.'
          );
          return of({ data: [] } as BaseModel<AcademicTermModel[]>);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe((res: BaseModel<AcademicTermModel[]>) => {
        if (res && res.data) {
          // Backend already filters terms from currentYear - 2 onwards
          this.academicTerms = res.data;
          this.applyFilter();
        } else {
          this.academicTerms = [];
          this.filteredAcademicTerms = [];
          this.total = 0;
          this.pageIndex = 1;
        }
      });
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

  onSearch(): void {
    this.pageIndex = 1; // Reset to first page when searching
    this.applyFilter();
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.pageIndex = 1; // Reset to first page when searching
    this.applyFilter(); // Filter in real-time as user types
  }

  private applyFilter(): void {
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      this.filteredAcademicTerms = [...this.academicTerms];
    } else {
      const searchLower = this.searchTerm.toLowerCase().trim();
      this.filteredAcademicTerms = this.academicTerms.filter(term => {
        const termName = this.getTermName(term.termId).toLowerCase();
        const year = term.year.toString();
        
        // Format dates for search
        let startDateStr = '';
        let endDateStr = '';
        if (term.startDate) {
          const startDate = new Date(term.startDate);
          startDateStr = startDate.toLocaleDateString() + ' ' + startDate.toISOString().split('T')[0];
        }
        if (term.endDate) {
          const endDate = new Date(term.endDate);
          endDateStr = endDate.toLocaleDateString() + ' ' + endDate.toISOString().split('T')[0];
        }
        
        return (
          termName.includes(searchLower) ||
          year.includes(searchLower) ||
          startDateStr.includes(searchLower) ||
          endDateStr.includes(searchLower)
        );
      });
    }
    
    this.total = this.filteredAcademicTerms.length;
    // Reset to first page if current page is beyond available data
    const maxPage = Math.ceil(this.total / this.pageSize);
    if (this.pageIndex > maxPage && maxPage > 0) {
      this.pageIndex = 1;
    }
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

  exportAcademicTerm(): void {
    if (this.isExporting) {
      return;
    }

    this.isExporting = true;
    this._crudService
      .getList('/AcademicTerms/excel')
      .pipe(
        catchError((error) => {
          this._customNotificationService.notification(
            'error',
            'Error',
            'Failed to export academic terms. Please try again.'
          );
          this.isExporting = false;
          return of({ data: null });
        })
      )
      .subscribe((res: BaseModel<string>) => {
        if (!res || !res.data) {
          this._customNotificationService.notification(
            'error',
            'Error',
            'No data available to export.'
          );
          this.isExporting = false;
          return;
        }

        const dataString = res.data.toString();
        if (dataString === 'No data found' || dataString.trim() === '') {
          this._customNotificationService.notification(
            'error',
            'Error',
            'No data found to export.'
          );
          this.isExporting = false;
          return;
        }

        // Handle file path response
        const filePath = dataString.startsWith('/') ? dataString : '/' + dataString;
        const fileLists = dataString.split('/');
        const fileName = fileLists[fileLists.length - 1] || 'academic-terms.xlsx';

        this._crudService
          .expoerExcel(filePath)
          .pipe(
            catchError((error) => {
              this._customNotificationService.notification(
                'error',
                'Error',
                'Failed to download Excel file. Please try again.'
              );
              this.isExporting = false;
              return of(null);
            }),
            finalize(() => {
              this.isExporting = false;
            })
          )
          .subscribe((blob: Blob | null) => {
            if (blob) {
              const downloadURL = window.URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = downloadURL;
              link.download = fileName;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              window.URL.revokeObjectURL(downloadURL);

              this._customNotificationService.notification(
                'success',
                'Success',
                'Excel file downloaded successfully.'
              );
            }
          });
      });
  }
}
