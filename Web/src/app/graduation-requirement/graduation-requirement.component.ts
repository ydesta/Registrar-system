import { Component, OnDestroy, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { PaginatorService, ServerPaginator } from '../reports/services/paginator.service';
import { CrudService } from '../services/crud.service';
import { CustomNotificationService } from '../services/custom-notification.service';

@Component({
  selector: 'app-graduation-requirement',
  templateUrl: './graduation-requirement.component.html',
  styleUrls: ['./graduation-requirement.component.scss']
})
export class GraduationRequirementComponent implements OnInit, OnDestroy {
  requirements: any[] = [];
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
    this._crudService.getPaginated(`/GraduationRequirements`, this.pager.query()).subscribe({
      next: (res: any) => {
        this.requirements = res.data;
        this.pager.applyResult(res);
      },
      error: () => this.pager.fail()
    });
  }

  showDeleteConfirm(id: any): void {
    this.reqId = id;
    this.modal.confirm({
      nzTitle: 'Are you sure delete this graduation requirement?',
      nzOkText: 'Yes',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this._crudService.delete('/GraduationRequirements', this.reqId).subscribe((res: any) => {
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
