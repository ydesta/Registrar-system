import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { AcademicProgrammeService } from "src/app/acadamic-programme/services/academic-programme.service";
import { StaticData } from "src/app/admission-request/model/StaticData";
import { CURRICULUM_STATUS } from "src/app/common/constant";
import { CrudService } from "src/app/services/crud.service";
import { CustomNotificationService } from "src/app/services/custom-notification.service";
import { CurriculumService } from "../services/curriculum.service";

@Component({
  selector: "app-add-curriculum",
  templateUrl: "./add-curriculum.component.html",
  styleUrls: ["./add-curriculum.component.scss"]
})
export class AddCurriculumComponent implements OnInit {
  action = "Add Curriculum";
  academicProgramForm: FormGroup;
  progId: any;
  academicPrograms: any;
  submit = "Save";
  listOfCurriculumStatus: StaticData[] = [];
  constructor(
    public aciveRoute: ActivatedRoute,
    private _route: Router,
    private _fb: FormBuilder,
    private _crudService: CrudService,
    private _customNotificationService: CustomNotificationService,
    private _academicProgrammeService: AcademicProgrammeService,
    private _curriculumService: CurriculumService
  ) {
    this.academicProgramForm = this._fb.group({
      curriculumCode: ["", Validators.required],
      acadamicProgrammeID: ["", Validators.required],
      effectiveDate: [null, Validators.required],
      durationOfStudy: ["", Validators.required],
      createdBy: [""],
      lastModifiedBy: [""],
      status: [1, []],
      remark: ["", [Validators.maxLength(250)]],
      minimumCumlativGPA: [0, [Validators.required,Validators.min(0), Validators.max(4)]],
      minimumMajorGPA: [0, [Validators.required,Validators.min(0), Validators.max(4)]],
      minTotalCreditHours: [0, [Validators.required,Validators.min(0), Validators.max(1000)]],
      passingGrade: [null, [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.progId = this.aciveRoute.snapshot.paramMap.get("id");
    if (this.progId != "null") {
      this.getCurriculumById(this.progId);
    }
    this.getAcademicProgramme();
    this.getListOfCurriculumStatus();
  }
  getCurriculumById(id: string) {
    this.action = "Edit Curriculum";
    this.submit = "Update";
    this._curriculumService.getCurriculumById(id).subscribe(res => {
      const data = res.data;
      this.academicProgramForm.patchValue({
        ...data,
        effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : null
      });
    });
  }
  getAcademicProgramme() {
    this._academicProgrammeService.getAcademicProgrammeList().subscribe((res: any) => {
      this.academicPrograms = res.data;
    });
  }

  submitForm() {
    if (!this.academicProgramForm.valid) {
      Object.values(this.academicProgramForm.controls).forEach(control => {
        control.markAsDirty();
        control.updateValueAndValidity({ onlySelf: true });
      });
      this._customNotificationService.notification(
        "error",
        "error",
        "Enter valid data."
      );
      return;
    }

    if (this.progId == "null") {
      this._curriculumService
        .create(this.academicProgramForm.value)
        .subscribe({
          next: () => {
            this._customNotificationService.notification(
              "success",
              "Success",
              "Curriculum registered successfully."
            );
            this._route.navigateByUrl("/curricula");
          },
          error: () => {
            this._customNotificationService.notification(
              "error",
              "Error",
              "Failed to save curriculum. Please try again."
            );
          }
        });
      return;
    }

    this._curriculumService
      .update(this.progId, this.academicProgramForm.value)
      .subscribe({
        next: (res: any) => {
          if (res.status == "success") {
            this._customNotificationService.notification(
              "success",
              "Success",
              res.data
            );
            this._route.navigateByUrl("/curricula");
          } else {
            this._customNotificationService.notification(
              "error",
              "Error",
              res.data
            );
          }
        },
        error: () => {
          this._customNotificationService.notification(
            "error",
            "Error",
            "Failed to update curriculum. Please try again."
          );
        }
      });
  }

  goBack(): void {
    this._route.navigateByUrl("/curricula");
  }

  getListOfCurriculumStatus() {
    let division: StaticData = new StaticData();
    CURRICULUM_STATUS.forEach(pair => {
      division = {
        Id: pair.Id,
        Description: pair.Description
      };
      this.listOfCurriculumStatus.push(division);
    });
  }
}
