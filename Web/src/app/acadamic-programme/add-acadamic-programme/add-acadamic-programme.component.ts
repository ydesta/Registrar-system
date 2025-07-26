import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { CrudService } from "src/app/services/crud.service";
import { CustomNotificationService } from "src/app/services/custom-notification.service";

@Component({
  selector: "app-add-acadamic-programme",
  templateUrl: "./add-acadamic-programme.component.html",
  styleUrls: ["./add-acadamic-programme.component.scss"]
})
export class AddAcadamicProgrammeComponent implements OnInit {
  action = "Add Acadamic Programme";
  acadamicProgramForm: FormGroup;
  acadamicProgramId: string = "";
  submit = "Save";

  constructor(
    public aciveRoute: ActivatedRoute,
    private _route: Router,
    private _fb: FormBuilder,
    private _crudService: CrudService,
    private _customNotificationService: CustomNotificationService
  ) {
    this.acadamicProgramForm = this._fb.group({
      acadamicProgrammeCode: ["", Validators.required],
      acadamicProgrammeTitle: ["", Validators.required],
      createdBy: [""],
      lastModifiedBy: [""],
      remark: ["", [Validators.maxLength(250)]]
    });
  }

  ngOnInit(): void {
    this.acadamicProgramId = this.aciveRoute.snapshot.paramMap.get(
      "id"
    )!.toString();

    if (this.acadamicProgramId != "null") {
      this.action = "Edit Acadamic Programme";
      this.submit = "Update";
      this._crudService
        .getList("/AcadamicProgramme" + "/" + this.acadamicProgramId)
        .subscribe((data: any) => {
          this.patchValues(data);
        });
    }
  }

  submitForm() {
    if (this.acadamicProgramId == "null") {
      if (this.acadamicProgramForm.valid) {
        this._crudService
          .add("/AcadamicProgramme", this.acadamicProgramForm.value)
          .subscribe((res: any) => {
            this._customNotificationService.notification(
              "success",
              "Success",
              "Acadamic Programme registered successfully."
            );
            this._route.navigateByUrl("acadamic-programme");
           // 
          });
      } else {
        this._customNotificationService.notification(
          "error",
          "error",
          "Enter valid data."
        );
      }
    } else if (this.acadamicProgramId != "null") {
      if (this.acadamicProgramForm.valid) {
        this._crudService
          .update(
            "/AcadamicProgramme",
            this.acadamicProgramId,
            this.acadamicProgramForm.value
          )
          .subscribe((res: any) => {
            if (res.status == "success") {
              this._customNotificationService.notification(
                "success",
                "Success",
                res.data
              );
              this._route.navigateByUrl("acadamic-programme");
            } else {
              this._customNotificationService.notification(
                "error",
                "Error",
                res.data
              );
            }
          });
      } else {
        this._customNotificationService.notification(
          "error",
          "error",
          "Enter valid data."
        );
      }
    }
  }

  patchValues(data: any) {
   // ;
    this.acadamicProgramForm.patchValue({
      acadamicProgrammeTitle: data.acadamicProgrammeTitle,
      remark: data.remark,
      acadamicProgrammeCode: data.acadamicProgrammeCode
    });
  }
}
