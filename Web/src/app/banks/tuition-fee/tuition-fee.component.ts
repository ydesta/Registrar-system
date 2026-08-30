import { Component, OnDestroy, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { TuitionFeeModel } from 'src/app/Models/TuitionFeeModel';
import { PaginatorService, ServerPaginator } from 'src/app/reports/services/paginator.service';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';

@Component({
  selector: 'app-tuition-fee',
  templateUrl: './tuition-fee.component.html',
  styleUrls: ['./tuition-fee.component.scss']
})
export class TuitionFeeComponent implements OnInit, OnDestroy {
  tuitionFees: TuitionFeeModel[] = [];
  reqId = '';
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
    this._crudService.getPaginated(`/TuitionFees`, this.pager.query()).subscribe({
      next: (res: any) => {
        this.tuitionFees = res.data;
        this.pager.applyResult(res);
      },
      error: () => {
        this.pager.fail();
        this._customNotificationService.notification('error', 'Error', 'Failed to fetch tuition fees');
      }
    });
  }

  exportTuitionFees() {
    this._customNotificationService.notification('info', 'Info', 'Export functionality will be implemented');
  }

  showDeleteConfirm(id: any): void {
    this.reqId = id;
    this.modal.confirm({
      nzTitle: 'Are you sure delete this Tuition Fee?',
      nzOkText: 'Yes',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this._crudService.delete('/TuitionFees', this.reqId).subscribe((res: any) => {
          this.fetchProgram();
          if (res.status == "success") {
            this._customNotificationService.notification('success', 'Success', res.data)
          }
          if (res.status == "error") {
            this._customNotificationService.notification('error', 'Error', res.data)
          }
        })
      },
      nzCancelText: 'No',
      nzOnCancel: () => {}
    });
  }
}
