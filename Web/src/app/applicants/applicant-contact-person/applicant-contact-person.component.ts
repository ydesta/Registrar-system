import { Component, OnDestroy, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { ApplicantContactPersonModel } from 'src/app/Models/ApplicantContactPersonModel';
import { PaginatorService, ServerPaginator } from 'src/app/reports/services/paginator.service';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';

@Component({
  selector: 'app-applicant-contact-person',
  templateUrl: './applicant-contact-person.component.html',
  styleUrls: ['./applicant-contact-person.component.scss']
})
export class ApplicantContactPersonComponent implements OnInit, OnDestroy {
  contactPersons: ApplicantContactPersonModel[] = [];
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
    this._crudService.getPaginated(`/ApplicantContactPersons`, this.pager.query()).subscribe({
      next: (res: any) => {
        this.contactPersons = res.data;
        this.pager.applyResult(res);
      },
      error: () => {
        this.contactPersons = [];
        this.pager.fail();
      }
    });
  }

  showDeleteConfirm(id: any): void {
    this.reqId = id;
    this.modal.confirm({
      nzTitle: 'Are you sure delete this Applicant Contact Person?',
      nzOkText: 'Yes',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this._crudService.delete('/ApplicantContactPersons', this.reqId).subscribe((res: any) => {
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
