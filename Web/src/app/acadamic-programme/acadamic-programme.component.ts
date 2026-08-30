import { Component, OnDestroy, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { PaginatorService, ServerPaginator } from '../reports/services/paginator.service';
import { CrudService } from '../services/crud.service';
import { CustomNotificationService } from '../services/custom-notification.service';

@Component({
  selector: 'app-acadamic-program',
  templateUrl: './acadamic-programme.component.html',
  styleUrls: ['./acadamic-programme.component.scss'],
})
export class AcadamicProgrammeComponent implements OnInit, OnDestroy {
  acadamicPrograms: any;
  progId: any;
  dateTime = Date.now();
  checked = false;
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
    this.pager.init(() => this.fetchProgram());
    this.fetchProgram();
  }

  ngOnDestroy(): void {
    this.pager.destroy();
  }

  fetchProgram() {
    this.pager.loading = true;
    this._crudService
      .getPaginated(`/AcadamicProgramme`, this.pager.query())
      .subscribe({
        next: (res: any) => {
          this.acadamicPrograms = res.data;
          this.pager.applyResult(res);
        },
        error: () => {
          this.acadamicPrograms = [];
          this.pager.fail();
        }
      });
  }

  showDeleteConfirm(id: any): void {
    this.progId = id;
    this.modal.confirm({
      nzTitle: 'Are you sure delete this program?',
      nzOkText: 'Yes',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this._crudService
          .delete('/AcadamicProgramme', this.progId)
          .subscribe((res: any) => {
            this.fetchProgram();
            if (res.status == 'success') {
              this._customNotificationService.notification(
                'success',
                'Success',
                res.data
              );
            }
            if (res.status == 'error') {
              this._customNotificationService.notification(
                'error',
                'Error',
                res.data
              );
            }
          });
      },
      nzCancelText: 'No',
      nzOnCancel: () => {},
    });
  }

  exportAcadamicProgram() {
    this._crudService
      .getList('/AcadamicProgramme/excel')
      .subscribe((res: any) => {
        if (res.data.toString() == 'No data found') {
          this._customNotificationService.notification(
            'error',
            'Error',
            res.data
          );
        } else {
          let fileLists = res.data.split('/');
          this._crudService
            .exportExcel('/' + res.data)
            .subscribe((data: any) => {
              let downloadURL = window.URL.createObjectURL(data);
              let link = document.createElement('a');
              link.href = downloadURL;
              link.download = fileLists[fileLists.length - 1];
              link.click();
              this._customNotificationService.notification(
                'success',
                'Success',
                'Excel file is downloaded succesfully.'
              );
            });
        }
      });
  }
}
