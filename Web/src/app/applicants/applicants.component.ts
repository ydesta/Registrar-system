import { Component, OnDestroy, OnInit } from "@angular/core";
import { NzModalService } from "ng-zorro-antd/modal";
import { ApplicantModel } from "src/app/Models/ApplicantModel";
import { PaginatorService, ServerPaginator } from "src/app/reports/services/paginator.service";
import { CrudService } from "src/app/services/crud.service";
import { CustomNotificationService } from "src/app/services/custom-notification.service";

@Component({
  selector: "app-applicants",
  templateUrl: "./applicants.component.html",
  styleUrls: ["./applicants.component.scss"]
})
export class ApplicantsComponent implements OnInit, OnDestroy {
  applicants: ApplicantModel[] = [];
  reqId = "";
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
    this.pager.init(() => this.fetchApplicants());
    this.fetchApplicants();
  }

  ngOnDestroy(): void {
    this.pager.destroy();
  }

  fetchApplicants() {
    this.pager.loading = true;
    this._crudService
      .getPaginated(`/Applicants`, this.pager.query())
      .subscribe({
        next: (res: any) => {
          this.applicants = res.data;
          this.pager.applyResult(res);
        },
        error: () => {
          this.applicants = [];
          this.pager.fail();
        }
      });
  }

  showDeleteConfirm(id: any): void {
    this.reqId = id;
    this.modal.confirm({
      nzTitle: "Are you sure delete this Student?",
      nzOkText: "Yes",
      nzOkType: "primary",
      nzOkDanger: true,
      nzOnOk: () => {
        this._crudService
          .delete("/Applicants", this.reqId)
          .subscribe((res: any) => {
            this.fetchApplicants();
            if (res.status == "success") {
              this._customNotificationService.notification(
                "success",
                "Success",
                res.data
              );
            }
            if (res.status == "error") {
              this._customNotificationService.notification(
                "error",
                "Error",
                res.data
              );
            }
          });
      },
      nzCancelText: "No",
      nzOnCancel: () => {}
    });
  }
}
