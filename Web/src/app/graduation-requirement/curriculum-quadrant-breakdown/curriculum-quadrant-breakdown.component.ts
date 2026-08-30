import { Component, OnDestroy, OnInit } from "@angular/core";
import { NzModalService } from "ng-zorro-antd/modal";
import { CurriculumQuadrantBreakdownModel } from "src/app/Models/CurriculumQuadrantBreakdownModel";
import { CrudService } from "src/app/services/crud.service";
import { CustomNotificationService } from "src/app/services/custom-notification.service";
import { CurriculumQuadrantBreakdownService } from "../services/curriculum-quadrant-breakdown.service";
import { StaticData } from "src/app/admission-request/model/StaticData";
import {
  ACADEMIC_TERM_STATUS,
  ACADEMIC_YEAR_NUMBER_STATUS
} from "src/app/common/constant";
import { PaginatorService, ServerPaginator } from "src/app/reports/services/paginator.service";

@Component({
  selector: "app-curriculum-quadrant-breakdown",
  templateUrl: "./curriculum-quadrant-breakdown.component.html",
  styleUrls: ["./curriculum-quadrant-breakdown.component.scss"]
})
export class CurriculumQuadrantBreakdownComponent implements OnInit, OnDestroy {
  curriculumQuadrantBreakdowns: CurriculumQuadrantBreakdownModel[] = [];
  reqId = "";
  checked = false;
  expandSet = new Set<number>();
  listOfTermNumber: StaticData[] = [];
  listOfYearNumber: StaticData[] = [];
  pager: ServerPaginator;

  constructor(
    private _customNotificationService: CustomNotificationService,
    private _crudService: CrudService,
    private modal: NzModalService,
    private _curriculumQuadrantBreakdownService: CurriculumQuadrantBreakdownService,
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
    this._curriculumQuadrantBreakdownService
      .getCurriculumQuadrantBreakdownListPaginated(this.pager.query())
      .subscribe({
        next: (res: any) => {
          this.curriculumQuadrantBreakdowns = res.data || [];
          this.pager.applyResult(res);
        },
        error: () => {
          this.curriculumQuadrantBreakdowns = [];
          this.pager.fail();
        }
      });
  }

  showDeleteConfirm(id: any): void {
    this.reqId = id;
    this.modal.confirm({
      nzTitle: "Are you sure delete this Curriculum Quadrant Breakdown?",
      nzOkText: "Yes",
      nzOkType: "primary",
      nzOkDanger: true,
      nzOnOk: () => {
        this._crudService
          .delete("/CurriculumQuadrantBreakdowns", this.reqId)
          .subscribe((res: any) => {
            this.fetchProgram();
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
      nzOnCancel: () => {}
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
}
