import { Component, OnDestroy, OnInit } from "@angular/core";
import { NzModalService } from "ng-zorro-antd/modal";
import { PaginatorService, ServerPaginator } from "src/app/reports/services/paginator.service";
import { CrudService } from "src/app/services/crud.service";
import { CustomNotificationService } from "src/app/services/custom-notification.service";

@Component({
  selector: "app-acadamic-programme-status",
  templateUrl: "./acadamic-programme-status.component.html",
  styleUrls: ["./acadamic-programme-status.component.scss"]
})
export class AcadamicProgrammeStatusComponent implements OnInit, OnDestroy {
  programStatus: any[] = [];
  progStatusId = "";
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
    this.pager.init(() => this.fetchProgramStatus());
    this.fetchProgramStatus();
  }

  ngOnDestroy(): void {
    this.pager.destroy();
  }

  fetchProgramStatus() {
    this.pager.loading = true;
    this._crudService
      .getPaginated(`/AcadamicProgrammeStatuss`, this.pager.query())
      .subscribe({
        next: (res: any) => {
          this.programStatus = res.data;
          this.pager.applyResult(res);
        },
        error: () => {
          this.programStatus = [];
          this.pager.fail();
        }
      });
  }

  showDeleteConfirm(id: any): void {
    this.progStatusId = id;
    this.modal.confirm({
      nzTitle: "Are you sure delete this program status?",
      nzOkText: "Yes",
      nzOkType: "primary",
      nzOkDanger: true,
      nzOnOk: () => {
        this._crudService
          .delete("/AcadamicProgrammeStatuss", this.progStatusId)
          .subscribe((res: any) => {
            this.fetchProgramStatus();
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

  exportAcadamicProgramStatus() {
    this._crudService
      .getList("/AcadamicProgrammeStatuss/excel")
      .subscribe((res: any) => {
        if (res.data.toString() == "No data found") {
          this._customNotificationService.notification(
            "error",
            "Error",
            res.data
          );
        } else {
          let fileLists = res.data.split("/");
          this._crudService
            .exportExcel("/" + res.data)
            .subscribe((data: any) => {
              let downloadURL = window.URL.createObjectURL(data);
              let link = document.createElement("a");
              link.href = downloadURL;
              link.download = fileLists[fileLists.length - 1];
              link.click();
              this._customNotificationService.notification(
                "success",
                "Success",
                "Excel file is downloaded succesfully."
              );
            });
        }
      });
  }
}
