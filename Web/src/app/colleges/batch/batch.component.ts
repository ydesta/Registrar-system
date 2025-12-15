import { Component, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { BaseModel } from 'src/app/Models/BaseMode';
import { BatchModel } from 'src/app/Models/BatchModel';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { StaticData } from 'src/app/admission-request/model/StaticData';
import { ACADEMIC_TERM_STATUS } from 'src/app/common/constant';

@Component({
  selector: 'app-batch',
  templateUrl: './batch.component.html',
  styleUrls: ['./batch.component.scss']
})
export class BatchComponent implements OnInit {
  batches: BatchModel[] = [];
  pageIndex = 1;
  pageSize = 10;
  pageSizeOption = [5, 10, 15, 25, 50, 100];
  total = 0;
  isLoading = true;
  searchKey = '';
  sortOrder = '';
  sortColumn = '';
  private searchSubject = new Subject<string>();
  paginatedBatches: BatchModel[] = [];
  filteredBatches: BatchModel[] = [];
  listOfTermNumber: StaticData[] = [];
  constructor(
    private _customNotificationService: CustomNotificationService,
    private _crudService: CrudService,
    private modal: NzModalService
  ) {
    // Initialize search with debounce

  }

  ngOnInit(): void {
    this.getListOfAcademicTermStatus();
    this.fetchBatches();
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchText => {
      this.filteredBatches = this.batches.filter(batch =>
        batch.batchCode.toLowerCase().includes(searchText.toLowerCase()) ||
        batch.curriculum.curriculumCode.toLowerCase().includes(searchText.toLowerCase()) ||
        batch.entryYear.toString().includes(searchText)
      );
      this.total = this.filteredBatches.length;
      this.updatePaginatedBatches();
    });
  }

  onSearch(): void {
    this.searchSubject.next(this.searchKey);
  }

  fetchBatches() {
    this.isLoading = true;
    this._crudService
      .getList('/batchs')
      .subscribe({
        next: (res: BaseModel<BatchModel[]>) => {
          this.batches = res.data.map((item: any) => {
            const term = this.listOfTermNumber.find(t => t.Id == item.entryTerm);
            return {
              ...item,
              academicTerm: term ? term.Description : ''
            };
          });
          this.filteredBatches = [...this.batches]
          this.total = this.filteredBatches.length;
          this.updatePaginatedBatches();
          this.isLoading = false;
        },
        error: (error) => {
          this._customNotificationService.notification(
            'error',
            'Error',
            error.error?.message || 'Failed to fetch batch data. Please check your connection and try again.'
          );
          this.isLoading = false;
        }
      });
  }

  updatePaginatedBatches(): void {
    const startIndex = (this.pageIndex - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedBatches = this.filteredBatches.slice(startIndex, endIndex);
  }

  onPageIndexChange(page: number): void {
    this.pageIndex = page;
    this.updatePaginatedBatches();
  }
  
  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageIndex = 1;  // Reset to first page when changing page size
    this.updatePaginatedBatches();
  }

  onSort(sort: { key: string; value: string }): void {
    this.sortColumn = sort.key;
    this.sortOrder = sort.value;
    this.updatePaginatedBatches();
  }
  getListOfAcademicTermStatus() {
    let division: StaticData = new StaticData();
    ACADEMIC_TERM_STATUS.forEach(pair => {
      division = {
        Id: pair.Id,
        Description: pair.Description
      };
      this.listOfTermNumber.push(division);
    });
  }
  showDeleteConfirm(id: string): void {
    this.modal.confirm({
      nzTitle: 'Are you sure you want to delete this batch?',
      nzOkText: 'Yes',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this._crudService
          .delete('/batches', id)
          .subscribe({
            next: (res: any) => {
              if (res.status === 'success') {
                this._customNotificationService.notification(
                  'success',
                  'Success',
                  res.data
                );
                this.fetchBatches();
              } else {
                this._customNotificationService.notification(
                  'error',
                  'Error',
                  res.data
                );
              }
            },
            error: (error) => {
              this._customNotificationService.notification(
                'error',
                'Error',
                'Failed to delete batch'
              );
            }
          });
      }
    });
  }

  exportBatch() {
    this._crudService.getList('/batches/excel').subscribe({
      next: (res: any) => {
        if (res.data.toString() === 'No data found') {
          this._customNotificationService.notification(
            'error',
            'Error',
            res.data
          );
        } else {
          const fileLists = res.data.split('/');
          this._crudService.expoerExcel('/' + res.data).subscribe((data: any) => {
            const downloadURL = window.URL.createObjectURL(data);
            const link = document.createElement('a');
            link.href = downloadURL;
            link.download = fileLists[fileLists.length - 1];
            link.click();
            this._customNotificationService.notification(
              'success',
              'Success',
              'Excel file is downloaded successfully.'
            );
          });
        }
      },
      error: (error) => {
        this._customNotificationService.notification(
          'error',
          'Error',
          'Failed to export data'
        );
      }
    });
  }
}
