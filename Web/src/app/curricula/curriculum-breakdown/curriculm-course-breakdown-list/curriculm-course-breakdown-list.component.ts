import { Component, OnInit } from "@angular/core";
import { NzModalService } from "ng-zorro-antd/modal";
import { CurriculumQuadrantBreakdownModel } from "src/app/Models/CurriculumQuadrantBreakdownModel";
import { StaticData } from "src/app/admission-request/model/StaticData";
import { CustomNotificationService } from "src/app/services/custom-notification.service";
import { CurriculumTermCourseBreakDownService } from "../../services/curriculum-term-course-break-down.service";
import {
  ACADEMIC_TERM_STATUS,
  ACADEMIC_YEAR_NUMBER_STATUS
} from "src/app/common/constant";
import { Router } from "@angular/router";

@Component({
  selector: "app-curriculum-course-breakdown-list",
  templateUrl: "./curriculum-course-breakdown-list.component.html",
  styleUrls: ["./curriculum-course-breakdown-list.component.scss"]
})
export class CurriculumCourseBreakdownListComponent implements OnInit {
  curriculumTermBreakdowns?: CurriculumQuadrantBreakdownModel[];
  reqId = "";
  checked = false;
  expandSet = new Set<number>();
  listOfTermNumber: StaticData[] = [];
  listOfYearNumber: StaticData[] = [];
  constructor(
    private _customNotificationService: CustomNotificationService,
    private modal: NzModalService,
    private router: Router,
    private _curriculumBreakdownService: CurriculumTermCourseBreakDownService
  ) {}

  ngOnInit(): void {
    this.getListOfAcademicTermStatus();
    this.getListOfYearNumberStatus();
    this.fetchProgram();
  }
  onExpandChange(id: number, checked: boolean): void {
    if (checked) {
      this.expandSet.add(id);
    } else {
      this.expandSet.delete(id);
    }
  }
  fetchProgram() {
    this._curriculumBreakdownService
      .getCurriculumCourseBreakdownList()
      .subscribe((res: any) => {
        this.curriculumTermBreakdowns = res;
      });
  }
  getCourseDetails(data: any): any[] {
    if (data.course && data.course.length > 0) {
      return data.course.map((c, index) => {
        return {
          number: index + 1,
          title: c.courseTitle,
          code: c.courseCode,
          creditHours: c.creditHours
        };
      });
    }
    return [];
  }
  getTotalCreditHours(data: any): number {
    let totalCreditHours = 0;
    if (data.course && data.course.length > 0) {
      data.course.forEach(c => {
        totalCreditHours += c.creditHours;
      });
    }
    return totalCreditHours;
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

  getYearNumberDescription(Id: any) {
    const program = this.listOfYearNumber.find(item => item.Id == Id);
    return program ? program.Description : "";
  }

  getAcademicTermStatusDescription(Id: any) {
    const program = this.listOfTermNumber.find(item => item.Id == Id);
    return program ? program.Description : "";
  }
  showDeleteConfirm(id: any): void {
    this.reqId = id;
    this.modal.confirm({
      nzTitle: "Are you sure delete this Curriculum Quadrant Breakdown?",
      // nzContent: '<b style="color: red;">Some descriptions</b>',
      nzOkText: "Yes",
      nzOkType: "primary",
      nzOkDanger: true,
      nzOnOk: () => {
        // this._crudService
        //   .delete("/CurriculumQuadrantBreakdowns", this.reqId)
        //   .subscribe((res: any) => {
        //     
        //     this.fetchProgram();
        //     if (res.status == "success") {
        //       this._customNotificationService.notification(
        //         "success",
        //         "Success",
        //         res.data
        //       );
        //     }
        //     if (res.status == "error") {
        //       this._customNotificationService.notification(
        //         "error",
        //         "Error",
        //         res.data
        //       );
        //     }
        //   });
      },
      nzCancelText: "No",
      nzOnCancel: () => {}
    });
  }
  gotoCurriculumBreakdown(id: number) {
    this.router.navigateByUrl(`curricula/curriculum-break-down-form?id=${id}`);
  }
}
