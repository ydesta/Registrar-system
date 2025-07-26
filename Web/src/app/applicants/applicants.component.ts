import { Component, OnInit } from "@angular/core";
import { NzModalService } from "ng-zorro-antd/modal";
import { BaseModel } from "src/app/Models/BaseMode";
import { ApplicantModel } from "src/app/Models/ApplicantModel";
import { CrudService } from "src/app/services/crud.service";
import { CustomNotificationService } from "src/app/services/custom-notification.service";
import { BatchModel } from "../Models/BatchModel";
import { EntryModel } from "../Models/EntryModel";

@Component({
  selector: "app-applicants",
  templateUrl: "./applicants.component.html",
  styleUrls: ["./applicants.component.scss"]
})
export class ApplicantsComponent implements OnInit {
  applicants?: ApplicantModel[];
  originalApplicants?: ApplicantModel[];
  searchText: string = "";
  reqId = "";
  checked = false;
  tableLoading = true;
  constructor(
    private _customNotificationService: CustomNotificationService,
    private _crudService: CrudService,
    private modal: NzModalService
  ) {}

  ngOnInit(): void {
    this.fetchApplicants();
  }

  fetchApplicants() {
    this._crudService
      .getList("/Applicants")
      .subscribe((res: BaseModel<ApplicantModel[]>) => {
        this.originalApplicants = res.data;
        this.applicants = res.data;
        this.tableLoading = false;
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
      nzOnCancel: () => console.log("Cancel")
    });
  }
  onSearchTextChanged() {
    if (!this.searchText) {
      // If the search text is empty, reset the applicants array to show all data.
      this.applicants = this.originalApplicants;
    } else {
      // Filter the applicants array based on the search text.
      const searchTextLower = this.searchText.toLowerCase();
      this.applicants = this.originalApplicants.filter(
        applicant =>
          applicant.firstName.toLowerCase().includes(searchTextLower) ||
          applicant.fatherName.toLowerCase().includes(searchTextLower) ||
          applicant.grandFatherName.toLowerCase().includes(searchTextLower) ||
          applicant.sirName.toLowerCase().includes(searchTextLower) ||
          applicant.motherName.toLowerCase().includes(searchTextLower) ||
          applicant.gender.toLowerCase().includes(searchTextLower)
      );
    }
  }
}
