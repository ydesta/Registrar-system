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
  loading = false;

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
    this.acadamicProgramId = this.aciveRoute.snapshot.paramMap.get("id")!.toString();

    if (this.acadamicProgramId != "null") {
      this.action = "Edit Acadamic Programme";
      this.submit = "Update";
      this._crudService
        .getById("/AcadamicProgramme", this.acadamicProgramId)
        .subscribe((data: any) => {
          this.patchValues(data);
        });
    }
  }

  goBack(): void {
    this._route.navigateByUrl("acadamic-programme");
  }

  submitForm() {
    if (!this.acadamicProgramForm.valid) {
      this._customNotificationService.notification(
        "error",
        "error",
        "Enter valid data."
      );
      return;
    }

    this.loading = true;
    if (this.acadamicProgramId == "null") {
      this._crudService
        .add("/AcadamicProgramme", this.acadamicProgramForm.value)
        .subscribe({
          next: () => {
            this._customNotificationService.notification(
              "success",
              "Success",
              "Acadamic Programme registered successfully."
            );
            this.loading = false;
            this.goBack();
          },
          error: () => {
            this.loading = false;
          }
        });
      return;
    }

    this._crudService
      .update(
        "/AcadamicProgramme",
        this.acadamicProgramId,
        this.acadamicProgramForm.value
      )
      .subscribe({
        next: (res: any) => {
          this.loading = false;
          if (res.status == "success") {
            this._customNotificationService.notification(
              "success",
              "Success",
              res.data
            );
            this.goBack();
          } else {
            this._customNotificationService.notification(
              "error",
              "Error",
              res.data
            );
          }
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  patchValues(data: any) {
    this.acadamicProgramForm.patchValue({
      acadamicProgrammeTitle: data.acadamicProgrammeTitle,
      remark: data.remark,
      acadamicProgrammeCode: data.acadamicProgrammeCode
    });
  }
}
