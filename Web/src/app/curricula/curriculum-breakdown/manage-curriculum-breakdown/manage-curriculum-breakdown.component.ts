import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { StaticData } from "src/app/admission-request/model/StaticData";
import {
  ACADEMIC_TERM_STATUS,
  ACADEMIC_YEAR_NUMBER_STATUS} from "src/app/common/constant";
import { CurriculumTermCourseBreakDownService } from "../../services/curriculum-term-course-break-down.service";

@Component({
  selector: "app-manage-curriculum-breakdown",
  templateUrl: "./manage-curriculum-breakdown.component.html",
  styleUrls: ["./manage-curriculum-breakdown.component.scss"]
})
export class ManageCurriculumBreakdownComponent implements OnInit {
  curriculumQuadrants: any[];
  curriculumBreakdownForm: FormGroup;
  curriculumId = "";
  activePanelKey: string;
  code: string;
  programme: string;
  listOfYearNumber: StaticData[] = [];
  listOfTermNumber: StaticData[] = [];
  numberOfTerms = 0;
  constructor(
    private curriculumTermCourseBreakDownService: CurriculumTermCourseBreakDownService,
    private route: ActivatedRoute,
    private router:Router,
    private _fb: FormBuilder
  ) {
    this.createBreakDown();
    this.route.queryParams.subscribe(p => {
      this.curriculumId = p["id"];
      this.code = p["code"];
      this.programme = p["programme"];
    });
  }
  ngOnInit(): void {
    this.getListOfYearNumberStatus();
    this.getListOfAcademicTermStatus();
    this.yearNumber.valueChanges.subscribe(res => {
      if (this.curriculumId != "" || this.curriculumId != undefined)
        this.getCurriculumCourseBreakdowns(this.curriculumId, res);
    });
  }
  createBreakDown() {
    this.curriculumBreakdownForm = this._fb.group({
      yearNumber: [0, [Validators.required]]
    });
  }
  get yearNumber() {
    return this.curriculumBreakdownForm.get("yearNumber");
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
  getAcademicTermStatusDescription(Id: any) {
    const program = this.listOfTermNumber.find(item => item.Id == Id);
    return program ? program.Description : "";
  }
  getCurriculumCourseBreakdowns(curId: string, year: number) {
    this.curriculumTermCourseBreakDownService
      .getCurriculumCourseBreakdowns(curId, year)
      .subscribe(res => {
        this.numberOfTerms = res.length;
        this.curriculumQuadrants = res;
      });
  }
  doAction(): void {
    const id = 0;
    this.router.navigateByUrl(
      `curricula/curriculum-break-down-form?id=${id}&&curriculum-id=${this.curriculumId}&&curriculum-code=${this.code}&&program=${this
        .programme}`
    );
  }
  goToCurriculum() {    
    this.router.navigateByUrl(`/curricula`);
  }
}
