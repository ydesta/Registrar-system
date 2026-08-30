import { Component, OnDestroy, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { BatchModel } from 'src/app/Models/BatchModel';
import { PaginatorService, ServerPaginator } from 'src/app/reports/services/paginator.service';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { StaticData } from 'src/app/admission-request/model/StaticData';
import { ACADEMIC_TERM_STATUS } from 'src/app/common/constant';

@Component({
  selector: 'app-batch',
  templateUrl: './batch.component.html',
  styleUrls: ['./batch.component.scss']
})
export class BatchComponent implements OnInit, OnDestroy {
  batches: BatchModel[] = [];
  pager: ServerPaginator;
  paginatedBatches: BatchModel[] = [];
  listOfTermNumber: StaticData[] = [];

  constructor(
    private _customNotificationService: CustomNotificationService,
    private _crudService: CrudService,
    private modal: NzModalService,
    private paginator: PaginatorService
  ) {
    this.pager = this.paginator.create();
  }

  ngOnInit(): void {
    this.getListOfAcademicTermStatus();
    this.pager.init(() => this.fetchBatches());
    this.fetchBatches();
  }

  ngOnDestroy(): void {
    this.pager.destroy();
  }

  fetchBatches() {
    this.pager.loading = true;
    this._crudService
      .getPaginated(`/batchs`, this.pager.query())
      .subscribe({
        next: (res: any) => {
          const rows = res?.data || [];
          this.paginatedBatches = rows.map((item: any) => {
            const term = this.listOfTermNumber.find(t => t.Id == item.entryTerm);
            return {
              ...item,
              academicTerm: term ? term.Description : ''
            };
          });
          this.pager.applyResult(res);
        },
        error: (error) => {
          this._customNotificationService.notification(
            'error',
            'Error',
            error.error?.message || 'Failed to fetch batch data. Please check your connection and try again.'
          );
          this.paginatedBatches = [];
          this.pager.fail();
        }
      });
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
            error: () => {
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
          this._crudService.exportExcel('/' + res.data).subscribe((data: any) => {
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
      error: () => {
        this._customNotificationService.notification(
          'error',
          'Error',
          'Failed to export data'
        );
      }
    });
  }
}
