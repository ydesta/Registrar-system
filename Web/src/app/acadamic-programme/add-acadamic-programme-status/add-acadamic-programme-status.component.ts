import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { CrudService } from "src/app/services/crud.service";
import { CustomNotificationService } from "src/app/services/custom-notification.service";

@Component({
  selector: "app-add-acadamic-programme-status",
  templateUrl: "./add-acadamic-programme-status.component.html",
  styleUrls: ["./add-acadamic-programme-status.component.scss"]
})
export class AddAcadamicProgrammeStatusComponent implements OnInit {
  action = "Add Acadamic Program Status";
  acadamicProgramStatusForm: FormGroup;
  acadamicPrograms: any;
  progStatusId: any;
  submit = "Save";
  constructor(
    public aciveRoute: ActivatedRoute,
    private _route: Router,
    private _fb: FormBuilder,
    private _crudService: CrudService,
    private _customNotificationService: CustomNotificationService
  ) {
    this.createAcademicStatus();
  }

  ngOnInit(): void {
    this.progStatusId = this.aciveRoute.snapshot.paramMap.get("id");
    if (this.progStatusId != "null") {
      this.action = "Edit Programme Status";
      this.submit = "Update";
      this._crudService
        .getList("/AcadamicProgrammeStatuss" + "/" + this.progStatusId)
        .subscribe((data: any) => {
          this.patchValues(data);
        });
    }
    this._crudService.getList("/AcadamicProgramme").subscribe((res: any) => {
      this.acadamicPrograms = res.data;
    });
  }
  private createAcademicStatus() {
    this.acadamicProgramStatusForm = this._fb.group({
      createdBy: ["-"],
      lastModifiedBy: ["-"],
      status: ["", Validators.required],
      date: [null, Validators.required],
      remark: [""],
      acadamicProgrammeCode: [null, Validators.required]
    });
  }
  submitForm() {
    if (this.acadamicProgramStatusForm.valid) {
      if (this.progStatusId == "null") {
        this._crudService
          .add(
            "/AcadamicProgrammeStatuss",
            this.acadamicProgramStatusForm.value
          )
          .subscribe((res: any) => {
            this._customNotificationService.notification(
              "success",
              "Success",
              "Acadamic Program Status registered successfully."
            );
            this._route.navigateByUrl("acadamic-program/program-status");
           // 
          });
      } else if (this.progStatusId != "null") {
        if (this.acadamicProgramStatusForm.valid) {
          this._crudService
            .update(
              "/AcadamicProgrammeStatuss",
              this.progStatusId,
              this.acadamicProgramStatusForm.value
            )
            .subscribe((res: any) => {
              if (res.status == "success") {
                this._customNotificationService.notification(
                  "success",
                  "Success",
                  res.data
                );
                this._route.navigateByUrl("acadamic-program/program-status");
              } else {
                this._customNotificationService.notification(
                  "error",
                  "Error",
                  res.data
                );
              }
            });
        }
      }
    } else {
      this._customNotificationService.notification(
        "error",
        "error",
        "Enter valid data."
      );
    }
  }
  patchValues(data: any) {
    //;
    this.acadamicProgramStatusForm.patchValue({
      status: data.status,
      date: data.date,
      remark: data.remark,
      acadamicProgrammeCode: data.acadamicProgrammeCode
    });
  }
}
