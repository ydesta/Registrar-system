import { Component, OnDestroy, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { PaginatorService, ServerPaginator } from 'src/app/reports/services/paginator.service';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';

@Component({
  selector: 'app-accrediation',
  templateUrl: './accrediation.component.html',
  styleUrls: ['./accrediation.component.scss'],
})
export class AccrediationComponent implements OnInit, OnDestroy {
  curriculums: any[] = [];
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
    this.pager.init(() => this.fetchAccreditation());
    this.fetchAccreditation();
  }

  ngOnDestroy(): void {
    this.pager.destroy();
  }

  fetchAccreditation() {
    this.pager.loading = true;
    this._crudService
      .getPaginated(`/CurriculumAccrediations`, this.pager.query())
      .subscribe({
        next: (res: any) => {
          this.curriculums = res.data;
          this.pager.applyResult(res);
        },
        error: () => {
          this._customNotificationService.notification(
            'error',
            'Error',
            'Failed to fetch accreditation data'
          );
          this.pager.fail();
        }
      });
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
            error: () => {
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
