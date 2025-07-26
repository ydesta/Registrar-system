import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { CrudService } from "src/app/services/crud.service";
import { CustomNotificationService } from "src/app/services/custom-notification.service";
import { CurriculumQuadrantBreakdownService } from "../services/curriculum-quadrant-breakdown.service";
import {
  ACADEMIC_TERM_STATUS,
  ACADEMIC_YEAR_NUMBER_STATUS,
  alphabetsWithSpecialCharsValidator,
  numbersOnlyValidator
} from "src/app/common/constant";
import { StaticData } from "src/app/admission-request/model/StaticData";
@Component({
  selector: "app-add-curriculum-quadrant-breakdown",
  templateUrl: "./add-curriculum-quadrant-breakdown.component.html",
  styleUrls: ["./add-curriculum-quadrant-breakdown.component.scss"]
})
export class AddCurriculumQuadrantBreakdownComponent implements OnInit {
  action = "Add Curriculum Breakdown";
  acadamicProgramForm: FormGroup;
  progId: any;
  curricula: any;
  acadamicprograms: any;
  courses: any[] = [];
  quadrants: any;
  submit = "Submit";
  listOfTermNumber: StaticData[] = [];
  listOfYearNumber: StaticData[] = [];
  listOfSelectedValue = [];
  constructor(
    public aciveRoute: ActivatedRoute,
    private _route: Router,
    private _fb: FormBuilder,
    private _crudService: CrudService,
    private _customNotificationService: CustomNotificationService,
    private _curriculumQuadrantBreakdownService: CurriculumQuadrantBreakdownService
  ) {
    this.createBreakDown();
  }

  ngOnInit(): void {
    this.progId = this.aciveRoute.snapshot.paramMap.get("id");
    if (this.progId != "null") {
      this.action = "Edit Curriculum Quadrant Breakdown";
      this.submit = "Update";
      this.getCurriculumQuadrantBreakdownsById(this.progId);
    }
    this.getQuadrantsList();
    this.getCourseList();
    this.getCurriculumsList();
    this.getListOfAcademicTermStatus();
    this.getListOfYearNumberStatus();
  }
  getQuadrantsList() {
    this._curriculumQuadrantBreakdownService
      .getQuadratList()
      .subscribe((res: any) => {
        this.quadrants = res.data;
      });
  }
  // getAcadamicProgrammeList() {
  //   this._crudService.getList("/AcadamicProgramme").subscribe((res: any) => {
  //     this.acadamicprograms = res.data;
  //   });
  // }
  getCurriculumsList() {
    this._curriculumQuadrantBreakdownService
      .getCurriculumList()
      .subscribe((res: any) => {
        this.curricula = res.data;
      });
  }
  getCourseList() {
    this._curriculumQuadrantBreakdownService
      .getCourseList()
      .subscribe((res: any) => {
        this.courses = res.data;
      });
  }
  getCurriculumQuadrantBreakdownsById(id: number) {
    this._curriculumQuadrantBreakdownService
      .getCurriculumQuadrantBreakdownId(id)
      .subscribe((res: any) => {
        this.patchValues(res.data);
      });
  }
  createBreakDown() {
    this.acadamicProgramForm = this._fb.group({
      CurriculumId: ["", Validators.required],
      courseId: ["", Validators.required],
      quadrantsId: ["", []],
      yearNumber: [0, [Validators.required, numbersOnlyValidator()]],
      termNumber: [0, [Validators.required, numbersOnlyValidator()]],
      createdBy: [""],
      lastModifiedBy: [""],
      remark: ["", [alphabetsWithSpecialCharsValidator()]]
    });
  }
  get remark() {
    return this.acadamicProgramForm.get("remark");
  }
  get termNumber() {
    return this.acadamicProgramForm.get("termNumber");
  }
  get yearNumber() {
    return this.acadamicProgramForm.get("yearNumber");
  }
  get quadrantsId() {
    return this.acadamicProgramForm.get("quadrantsId");
  }
  get CurriculumId() {
    return this.acadamicProgramForm.get("CurriculumId");
  }
  get courseId() {
    return this.acadamicProgramForm.get("courseId");
  }

  submitForm() {
    if (this.progId == "null") {
      if (this.acadamicProgramForm.valid) {
        this._curriculumQuadrantBreakdownService
          .create(this.acadamicProgramForm.value)
          .subscribe((res: any) => {
            this._customNotificationService.notification(
              "success",
              "Success",
              "Curriculum Quadrant Breakdown saved successfully."
            );
            this._route.navigateByUrl("graduation/cuadrant-breakdown");
          });
      } else {
        this._customNotificationService.notification(
          "error",
          "error",
          "Enter valid data."
        );
      }
    } else if (this.progId != "null") {
      if (this.acadamicProgramForm.valid) {
        this._curriculumQuadrantBreakdownService
          .update(this.progId, this.acadamicProgramForm.value)
          .subscribe((res: any) => {
            if (res.status == "success") {
              this._customNotificationService.notification(
                "success",
                "Success",
                res.data
              );
              this._route.navigateByUrl("graduation/cuadrant-breakdown");
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
    this.acadamicProgramForm.patchValue({
      CurriculumId: data.curriculumId,
      courseId: data.courseId ? data.courseId.map(c => c) : [],
      quadrantsId: data.quadrantsID,
      yearNumber: data.yearNumber,
      termNumber: data.termNumber,
      createdBy: data.createdBy,
      lastModifiedBy: data.lastModifiedBy,
      remark: data.remark
    });
  }
  getListOfAcademicTermStatus() {
    let division: StaticData = new StaticData();
    ACADEMIC_TERM_STATUS.forEach(pair => {
      division = {
        Id: pair.Id.toString(),
        Description: pair.Description
      };
      this.listOfTermNumber.push(division);
    });
  }
  getListOfYearNumberStatus() {
    let division: StaticData = new StaticData();
    ACADEMIC_YEAR_NUMBER_STATUS.forEach(pair => {
      division = {
        Id: pair.Id.toString(),
        Description: pair.Description
      };
      this.listOfYearNumber.push(division);
    });
  }
  getDivisionStatusDescription(Id: any) {
    const program = this.listOfTermNumber.find(item => item.Id == Id);
    return program ? program.Description : "";
  }
}
