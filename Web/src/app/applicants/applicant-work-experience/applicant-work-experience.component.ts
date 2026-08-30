import { Component, OnDestroy, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { ApplicantExperienceModel } from 'src/app/Models/ApplicantExperienceModel';
import { PaginatorService, ServerPaginator } from 'src/app/reports/services/paginator.service';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';

@Component({
  selector: 'app-applicant-work-experience',
  templateUrl: './applicant-work-experience.component.html',
  styleUrls: ['./applicant-work-experience.component.scss']
})
export class ApplicantWorkExperienceComponent implements OnInit, OnDestroy {
  applicantWorkExperiences: ApplicantExperienceModel[] = [];
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
    this._crudService.getPaginated(`/ApplicantWorkExperiences`, this.pager.query()).subscribe({
      next: (res: any) => {
        this.applicantWorkExperiences = res.data;
        this.pager.applyResult(res);
      },
      error: () => {
        this.applicantWorkExperiences = [];
        this.pager.fail();
      }
    });
  }

  showDeleteConfirm(id: any): void {
    this.reqId = id;
    this.modal.confirm({
      nzTitle: 'Are you sure delete this Work Experience?',
      nzOkText: 'Yes',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this._crudService.delete('/ApplicantWorkExperiences', this.reqId).subscribe((res: any) => {
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
