import { Component, OnInit } from "@angular/core";
import { NzModalService } from "ng-zorro-antd/modal";
import { CrudService } from "src/app/services/crud.service";
import { CustomNotificationService } from "src/app/services/custom-notification.service";

@Component({
  selector: "app-acadamic-programme-status",
  templateUrl: "./acadamic-programme-status.component.html",
  styleUrls: ["./acadamic-programme-status.component.scss"]
})
export class AcadamicProgrammeStatusComponent implements OnInit {
  programStatus: any;
  progStatusId = "";
  checked = false;
  constructor(
    private _customNotificationService: CustomNotificationService,
    private _crudService: CrudService,
    private modal: NzModalService
  ) {}

  ngOnInit(): void {
    this.fetchProgramStatus();
  }

  fetchProgramStatus() {
    this._crudService
      .getList("/AcadamicProgrammeStatuss")
      .subscribe((res: any) => {
        this.programStatus = res.data;
      });
  }

  showDeleteConfirm(id: any): void {
    this.progStatusId = id;
    this.modal.confirm({
      nzTitle: "Are you sure delete this program status?",
      // nzContent: '<b style="color: red;">Some descriptions</b>',
      nzOkText: "Yes",
      nzOkType: "primary",
      nzOkDanger: true,
      nzOnOk: () => {
        this._crudService
          .delete("/AcadamicProgrammeStatuss", this.progStatusId)
          .subscribe((res: any) => {
           // 
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
      nzOnCancel: () => console.log("Cancel")
    });
  }

  exportAcadamicProgramStatus() {
    this._crudService
      .getList("/AcadamicProgrammeStatuss/excel")
      .subscribe((res: any) => {
        //acadamic-programme
        if (res.data.toString() == "No data found") {
          this._customNotificationService.notification(
            "error",
            "Error",
            res.data
          );
        } else {
          let fileLists = res.data.split("/");
          this._crudService
            .expoerExcel("/" + res.data)
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
