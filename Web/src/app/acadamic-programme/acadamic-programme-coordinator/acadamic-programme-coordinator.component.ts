import { Component, OnDestroy, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { PaginatorService, ServerPaginator } from 'src/app/reports/services/paginator.service';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-acadamic-program-coordinator',
  templateUrl: './acadamic-programme-coordinator.component.html',
  styleUrls: ['./acadamic-programme-coordinator.component.scss']
})
export class AcadamicProgrammeCoordinatorComponent implements OnInit, OnDestroy {
  programCoordinator: any[] = [];
  progCoordinorId = '';
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
    this.pager.init(() => this.fetchProgramCoordinator());
    this.fetchProgramCoordinator();
  }

  ngOnDestroy(): void {
    this.pager.destroy();
  }

  fetchProgramCoordinator() {
    this.pager.loading = true;
    this._crudService
      .getPaginated(`/${environment.apiVersion}/acadamicprogrammecoordinators`, this.pager.query())
      .subscribe({
        next: (res: any) => {
          this.programCoordinator = res.data || [];
          this.pager.applyResult(res);
        },
        error: () => {
          this.programCoordinator = [];
          this.pager.fail();
        }
      });
  }

  showDeleteConfirm(id: any): void {
    this.progCoordinorId = id;
    this.modal.confirm({
      nzTitle: 'Are you sure delete this program coordinator?',
      nzOkText: 'Yes',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this._crudService.delete(`/${environment.apiVersion}/acadamicprogrammecoordinators`, this.progCoordinorId).subscribe((res: any) => {
          this.fetchProgramCoordinator();
          if (res.status == "success" || res.Status == "success") {
            this._customNotificationService.notification('success', 'Success', res.data || res.Data)
          }
          if (res.status == "error" || res.Status == "error") {
            this._customNotificationService.notification('error', 'Error', res.data || res.Data || res.error || res.Error)
          }
        })
      },
      nzCancelText: 'No',
      nzOnCancel: () => {}
    });
  }
}
