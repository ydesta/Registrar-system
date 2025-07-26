import { Component, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';

@Component({
  selector: 'app-accrediation',
  templateUrl: './accrediation.component.html',
  styleUrls: ['./accrediation.component.scss'],
})
export class AccrediationComponent implements OnInit {
  curriculums: any[] = [];
  pageindex = 1;
  pageSize = 5;
  pageSizeOption = [5, 10, 15, 25, 50, 100];
  totalRecord = 0;
  tbLoading = true;
  searchKey = '';
  sortOrder = '';
  sortColumn = '';

  constructor(
    private _customNotificationService: CustomNotificationService,
    private _crudService: CrudService,
    private modal: NzModalService
  ) {}

  ngOnInit(): void {
    this.fetchAccreditation();
  }

  fetchAccreditation() {
    this.tbLoading = true;
    this._crudService
      .getList(
        `/Accreditation/paginated?searchKey=${this.searchKey}&pageindex=${
          this.pageindex - 1
        }&pageSize=${this.pageSize}&sortColumn=${this.sortColumn}&sortOrder=${
          this.sortOrder
        }`
      )
      .subscribe({
        next: (res: any) => {
          this.curriculums = res.data;
          this.totalRecord = res.totalRowCount;
          this.pageSize = res.itemPerPage;
          this.pageindex = res.currentPage + 1;
          this.tbLoading = false;
        },
        error: (error) => {
          this._customNotificationService.notification(
            'error',
            'Error',
            'Failed to fetch accreditation data'
          );
          this.tbLoading = false;
        }
      });
  }

  paginatedIndexEvent(event: number): void {
    this.pageindex = event;
    this.fetchAccreditation();
  }

  paginatedSizeEvent(event: number): void {
    this.pageSize = event;
    this.pageindex = 1; // Reset to first page when page size changes
    this.fetchAccreditation();
  }

  showDeleteConfirm(id: string): void {
    this.modal.confirm({
      nzTitle: 'Are you sure you want to delete this accreditation?',
      nzOkText: 'Yes',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this._crudService
          .delete('/Accreditation', id)
          .subscribe({
            next: (res: any) => {
              if (res.status === 'success') {
                this._customNotificationService.notification(
                  'success',
                  'Success',
                  res.data
                );
                this.fetchAccreditation();
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
                'Failed to delete accreditation'
              );
            }
          });
      }
    });
  }

  exportAccrediation() {
    this._crudService.getList('/Accreditation/excel').subscribe({
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
