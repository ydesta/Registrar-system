import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { QuadrantModel } from 'src/app/Models/QuadrantModel';
import { PaginatorService, ServerPaginator } from 'src/app/reports/services/paginator.service';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';

@Component({
  selector: 'app-quadrant',
  templateUrl: './quadrant.component.html',
  styleUrls: ['./quadrant.component.scss']
})
export class QuadrantComponent implements OnInit, OnDestroy {
  quadrants: QuadrantModel[] = [];
  reqId = '';
  checked = false;
  pager: ServerPaginator;
  @ViewChild('emptyTpl') emptyTpl!: TemplateRef<void>;

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
    this._crudService.getPaginated(`/quadrants`, this.pager.query()).subscribe({
      next: (res: any) => {
        this.quadrants = res.data;
        this.pager.applyResult(res);
      },
      error: () => {
        this.quadrants = [];
        this.pager.fail();
      }
    });
  }

  showDeleteConfirm(id: any): void {
    this.reqId = id;
    this.modal.confirm({
      nzTitle: 'Are you sure delete this quadrant?',
      nzOkText: 'Yes',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this._crudService.delete('/quadrants', this.reqId).subscribe((res: any) => {
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
