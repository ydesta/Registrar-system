import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { CurriculumService } from "src/app/curricula/services/curriculum.service";
import { CustomNotificationService } from "src/app/services/custom-notification.service";
import { BatchService } from "../services/batch.service";
import { StaticData } from "src/app/admission-request/model/StaticData";
import { ACADEMIC_TERM_STATUS, PROGRAM_TYPE } from "src/app/common/constant";

@Component({
  selector: "app-add-batch",
  templateUrl: "./add-batch.component.html",
  styleUrls: ["./add-batch.component.scss"]
})
export class AddBatchComponent implements OnInit {
  action = "Add Batch";
  batchForm: FormGroup;
  acadamicPrograms: any;
  progStatusId: any;
  curricula: any;
  submit = "Save";
  yearList: number[] = [];
  listOfTermNumber: StaticData[] = [];
  listOfProgramType: StaticData[] = [];
  loading = false;

  constructor(
    public aciveRoute: ActivatedRoute,
    private _route: Router,
    private _fb: FormBuilder,
    private _customNotificationService: CustomNotificationService,
    private _curriculumService: CurriculumService,
    private _batchService: BatchService
  ) {
    const currentYear = new Date();
    this.yearList = this.getYearRange(currentYear.getFullYear());
    this.createForm();
  }

  ngOnInit(): void {
    this.getListOfAcademicTermStatus();
    this.getListOfProgramType();
    this.progStatusId = this.aciveRoute.snapshot.paramMap.get("id");
    if (this.progStatusId != "null") {
      this.action = "Edit Batch";
      this.submit = "Update";
      this.getBatchById(this.progStatusId);
    }
    this.getCurriculumList();
  }
  getListOfAcademicTermStatus() {
    let division: StaticData = new StaticData();
    ACADEMIC_TERM_STATUS.forEach(pair => {
      division = {
        Id: pair.Id,
        Description: pair.Description
      };
      this.listOfTermNumber.push(division);
    });
  }
  getCurriculumList() {
    this._curriculumService.getCurriculumList().subscribe((res: any) => {
      this.curricula = res.data;
    });
  }
  getBatchById(id: any) {
    this._batchService.getBatchById(id).subscribe((res: any) => {
      this.patchValues(res.data);
    });
  }
  createForm() {
    this.batchForm = this._fb.group({
      createdBy: ["-"],
      lastModifiedBy: ["-"],
      curriculumCode: ["", [Validators.required]],
      batchCode: ["", Validators.required],
      remark: [""],
      entryYear: [null, []],
      entryTerm: [null, [Validators.required]],
      amount: [null, [Validators.required]],
      educationLevel: [null, [Validators.required]]
    });
  }
    getListOfProgramType() {
      let division: StaticData = new StaticData();
      PROGRAM_TYPE.forEach(pair => {
        division = {
          Id: pair.Id,
          Description: pair.Description
        };
        this.listOfProgramType.push(division);
      });
    }
  submitForm() {
    if (this.batchForm.valid) {
      this.loading = true;
      if (this.progStatusId == "null") {
        this._batchService
          .create(this.batchForm.value)
          .subscribe({
            next: (res: any) => {
              this._customNotificationService.notification(
                "success",
                "Success",
                res.data
              );
              this._route.navigateByUrl("colleges/batch");
            },
            error: (error) => {
              this._customNotificationService.notification(
                "error",
                "Error",
                "Failed to create batch"
              );
            },
            complete: () => {
              this.loading = false;
            }
          });
      } else if (this.progStatusId != "null") {
        this._batchService
          .update(this.progStatusId, this.batchForm.value)
          .subscribe({
            next: (res: any) => {
              if (res.status == "success") {
                this._customNotificationService.notification(
                  "success",
                  "Success",
                  res.data
                );
                this._route.navigateByUrl("colleges/batch");
              } else {
                this._customNotificationService.notification(
                  "error",
                  "Error",
                  res.data
                );
              }
            },
            error: (error) => {
              this._customNotificationService.notification(
                "error",
                "Error",
                "Failed to update batch"
              );
            },
            complete: () => {
              this.loading = false;
            }
          });
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
    this.batchForm.patchValue({
      batchCode: data.batchCode,
      curriculumCode: data.curriculumCode,
      entryYear: data.entryYear,
      entryTerm: data.entryTerm,
      remark: data.remark,
      amount: data.amount,
    });
  }
  getYearRange(currentYear: number): number[] {
    const startYear = 1998;
    const yearList = [];

    for (let year = startYear; year <= currentYear; year++) {
      yearList.push(year);
    }

    return yearList.reverse();
  }

  goBack(): void {
    this._route.navigateByUrl("colleges/batch");
  }
}
