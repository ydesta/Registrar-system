import { Component, OnDestroy, OnInit } from "@angular/core";
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
import { PaginatorService, ServerPaginator } from "src/app/reports/services/paginator.service";

@Component({
  selector: "app-curriculum-course-breakdown-list",
  templateUrl: "./curriculum-course-breakdown-list.component.html",
  styleUrls: ["./curriculum-course-breakdown-list.component.scss"]
})
export class CurriculumCourseBreakdownListComponent implements OnInit, OnDestroy {
  curriculumTermBreakdowns: CurriculumQuadrantBreakdownModel[] = [];
  reqId = "";
  checked = false;
  expandSet = new Set<number>();
  listOfTermNumber: StaticData[] = [];
  listOfYearNumber: StaticData[] = [];
  pager: ServerPaginator;

  constructor(
    private _customNotificationService: CustomNotificationService,
    private modal: NzModalService,
    private router: Router,
    private _curriculumBreakdownService: CurriculumTermCourseBreakDownService,
    private paginator: PaginatorService
  ) {
    this.pager = this.paginator.create();
  }

  ngOnInit(): void {
    this.getListOfAcademicTermStatus();
    this.getListOfYearNumberStatus();
    this.pager.init(() => this.fetchProgram());
    this.fetchProgram();
  }

  ngOnDestroy(): void {
    this.pager.destroy();
  }

  onExpandChange(id: number, checked: boolean): void {
    if (checked) {
      this.expandSet.add(id);
    } else {
      this.expandSet.delete(id);
    }
  }

  fetchProgram() {
    this.pager.loading = true;
    this._curriculumBreakdownService
      .getCurriculumCourseBreakdownListPaginated(this.pager.query())
      .subscribe({
        next: (res: any) => {
          this.curriculumTermBreakdowns = res.data || [];
          this.pager.applyResult(res);
        },
        error: () => {
          this.curriculumTermBreakdowns = [];
          this.pager.fail();
        }
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
      nzOkText: "Yes",
      nzOkType: "primary",
      nzOkDanger: true,
      nzOnOk: () => {},
      nzCancelText: "No",
      nzOnCancel: () => {}
    });
  }

  gotoCurriculumBreakdown(id: number) {
    this.router.navigateByUrl(`curricula/curriculum-break-down-form?id=${id}`);
  }
}
