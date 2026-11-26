import { Component, OnInit, OnDestroy } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { NzModalRef, NzModalService } from "ng-zorro-antd/modal";
import { BaseModel } from "src/app/Models/BaseMode";
import { TermCourseOfferingModel } from "src/app/Models/TermCourseOfferingModel";
import { StaticData } from "src/app/admission-request/model/StaticData";
import {
  ACADEMIC_TERM_STATUS,
  ACADEMIC_YEAR_NUMBER_STATUS
} from "src/app/common/constant";
import { PaginatorService, ServerPaginator } from "src/app/reports/services/paginator.service";
import { CrudService } from "src/app/services/crud.service";
import { CustomNotificationService } from "src/app/services/custom-notification.service";
import { CourseOfferingInstructorAssignmentComponent } from "../course-offering-instructor-assignment/course-offering-instructor-assignment.component";
import { TermCourseOfferingService } from "../services/term-course-offering.service";

@Component({
  selector: "app-term-course-offering",
  templateUrl: "./term-course-offering.component.html",
  styleUrls: ["./term-course-offering.component.scss"]
})
export class TermCourseOfferingComponent implements OnInit, OnDestroy {
  termCourseOfferings: any[] = [];
  reqId = "";
  checked = false;
  academicTerms: any;
  gradeQueryForm: FormGroup;
  studentId = "";
  debugTime = new Date().toLocaleString();
  pager: ServerPaginator;
  listOfTermNumber: StaticData[] = [];
  listOfYearNumber: StaticData[] = [];
  expandSet = new Set<string>();
  isActiveFilter: boolean | null = true;
  yearFilter: number | null = null;
  termFilter: number | null = null;
  batchFilter: string | null = null;
  batchOptions: { batchCode: string }[] = [];
  yearOptions: number[] = [];
  termSortOrder: string | null = "descend";
  /** Offerings load only after Apply with Term + Year + Batch. */
  hasAppliedFilters = false;
  loadingBatches = false;
  isSearchCollapsed = false;

  toggleSearchForm(): void {
    this.isSearchCollapsed = !this.isSearchCollapsed;
  }

  constructor(
    private _customNotificationService: CustomNotificationService,
    private _crudService: CrudService,
    private _fb: FormBuilder,
    private modal: NzModalService,
    private termCourseOfferingService: TermCourseOfferingService,
    private paginator: PaginatorService
  ) {
    this.pager = this.paginator.create();
    this.gradeQueryForm = this._fb.group({
      termCode: ["", Validators.required],
      studentId: [""]
    });
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 10; i <= currentYear + 5; i++) {
      this.yearOptions.push(i);
    }
  }

  ngOnInit(): void {
    this.getListOfAcademicTermStatus();
    this.getListOfYearNumberStatus();
    this.pager.sortColumn = "Year";
    this.pager.sortOrder = "desc";
    this.pager.init(() => this.fetchProgram());
    // Do not load offerings until Apply is used
    this.termCourseOfferings = [];
  }

  ngOnDestroy(): void {
    this.pager.destroy();
  }

  onTermSort(order: string | null): void {
    this.termSortOrder = order;
    if (!this.hasAppliedFilters) {
      return;
    }
    this.pager.onSort(order, "Year");
  }

  fetchProgram() {
    if (!this.hasAppliedFilters || !this.canApplyFilters()) {
      this.termCourseOfferings = [];
      this.pager.total = 0;
      this.pager.loading = false;
      return;
    }

    this.pager.loading = true;
    const query = this.pager.query({
      isActive: this.isActiveFilter,
      year: this.yearFilter,
      academicTermSeason: this.termFilter,
      batchCode: this.batchFilter
    });

    this._crudService
      .getPaginated(`/TermCourseOfferings`, query)
      .subscribe((res: any) => {
        if (!res || !res.data) {
          this.termCourseOfferings = [];
          this.pager.fail();
          return;
        }

        this.termCourseOfferings = res.data.map((item: any) => {
          const term = this.listOfTermNumber.find(t => t.Id === item.academicTermSeason);
          let courseDetails: any[] = [];
          let totalCreditHours = 0;
          let totalAssignedInstructors = 0;
          if (item.couse && item.couse.length > 0) {
            courseDetails = item.couse.map((c: any, index: number) => {
              totalCreditHours += c.creditHours || 0;
              totalAssignedInstructors += c.noOfAssignedInstructor || 0;
              return {
                number: index + 1,
                title: c.courseTitle,
                code: c.courseCode,
                creditHours: c.creditHours,
                noOfAssignedInstructor: c.noOfAssignedInstructor,
                courseId: c.id,
                courseOfferingId: c.courseOfferingId || c.id,
                isActive: c.isActive !== undefined ? c.isActive : true
              };
            });
          }
          return {
            ...item,
            academicTerm: term ? term.Description : '',
            courseDetails,
            totalCreditHours,
            totalAssignedInstructors
          };
        });
        this.pager.applyResult(res);
      }, (error) => {
        console.error('Error fetching term course offerings:', error);
        this.termCourseOfferings = [];
        this.pager.fail();
        this._customNotificationService.notification(
          'error',
          'Error',
          'Failed to load term course offerings. Please try again.'
        );
      });
  }

  canApplyFilters(): boolean {
    return this.termFilter != null
      && this.yearFilter != null
      && !!this.batchFilter;
  }

  applyFilters(): void {
    if (!this.canApplyFilters()) {
      this._customNotificationService.notification(
        "warning",
        "Filter required",
        "Select Term, Year, and Batch, then click Search."
      );
      return;
    }
    this.hasAppliedFilters = true;
    this.pager.pageIndex = 1;
    this.isSearchCollapsed = true;
    this.fetchProgram();
  }

  clearSearch(): void {
    this.termFilter = null;
    this.yearFilter = null;
    this.batchFilter = null;
    this.isActiveFilter = true;
    this.batchOptions = [];
    this.hasAppliedFilters = false;
    this.termCourseOfferings = [];
    this.pager.total = 0;
    this.isSearchCollapsed = false;
  }

  onTermOrYearFilterChange(): void {
    this.batchFilter = null;
    this.batchOptions = [];
    this.hasAppliedFilters = false;
    this.termCourseOfferings = [];
    this.pager.total = 0;
    this.loadBatchOptions();
  }

  onBatchFilterChange(): void {
    this.hasAppliedFilters = false;
    this.termCourseOfferings = [];
    this.pager.total = 0;
  }

  private loadBatchOptions(): void {
    if (this.termFilter == null || this.yearFilter == null) {
      return;
    }
    this.loadingBatches = true;
    this.termCourseOfferingService
      .getListOfBatchCodeByAcademicTerm(this.termFilter, this.yearFilter)
      .subscribe({
        next: (res: any) => {
          const rows = Array.isArray(res) ? res : (res?.data || []);
          const codes = new Set<string>();
          this.batchOptions = [];
          (rows || []).forEach((b: any) => {
            const batchCode = b.batchCode || b.BatchCode || b;
            if (batchCode && !codes.has(batchCode)) {
              codes.add(batchCode);
              this.batchOptions.push({ batchCode });
            }
          });
          this.loadingBatches = false;
        },
        error: () => {
          this.batchOptions = [];
          this.loadingBatches = false;
        }
      });
  }

  showDeleteConfirm(id: any): void {
    this.reqId = id;
    this.modal.confirm({
      nzTitle: "Are you sure delete this Term Course Offering?",
      nzOkText: "Yes",
      nzOkType: "primary",
      nzOkDanger: true,
      nzOnOk: () => {
        this.termCourseOfferingService
          .delete(this.reqId)
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
  showDeactivateConfirm(id: any): void {
    this.reqId = id;
    this.modal.confirm({
      nzTitle: "Are you sure deactivate this Term Course Offering?",
      nzOkText: "Yes",
      nzOkType: "primary",
      nzOkDanger: true,
      nzOnOk: () => {
        this.termCourseOfferingService
          .deactivate(this.reqId)
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


  showActivateCourseOffering(id: number): void {
    this.modal.confirm({
      nzTitle: "Are you sure activate this Course Offering?",
      nzOkText: "Yes",
      nzOkType: "primary",
      nzOkDanger: false,
      nzOnOk: () => {
        this.termCourseOfferingService
          .activateCourseOffering(id)
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

  showDeactivateCourseOffering(id: number): void {
    this.modal.confirm({
      nzTitle: "Are you sure deactivate this Course Offering?",
      nzOkText: "Yes",
      nzOkType: "primary",
      nzOkDanger: true,
      nzOnOk: () => {
        this.termCourseOfferingService
          .deactivateCourseOfering(id)
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


  academicTermFormSubmit() {
    if (this.gradeQueryForm.value["termCode"] != "") {
      this._crudService
        .getList(
          "/TermCourseOfferings/academicTerm/" +
          this.gradeQueryForm.value["termCode"]
        )
        .subscribe((res: BaseModel<TermCourseOfferingModel[]>) => {
          this.termCourseOfferings = res.data;

        });
    } else {
      alert("Please select query!");
    }
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
  getListOfYearNumberStatus() {
    let division: StaticData = new StaticData();
    ACADEMIC_YEAR_NUMBER_STATUS.forEach(pair => {
      division = {
        Id: pair.Id,
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
  onExpandChange(id: string, checked: boolean): void {
    if (checked) {
      this.expandSet.add(id);
    } else {
      this.expandSet.delete(id);
    }
  }
  getCourseDetails(data: any): any[] {
    if (data.couse && data.couse.length > 0) {
      return data.couse.map((c, index) => {
        return {
          number: index + 1,
          title: c.courseTitle,
          code: c.courseCode,
          creditHours: c.creditHours,
          noOfAssignedInstructor: c.noOfAssignedInstructor,
          courseId: c.id,
          courseOfferingId: c.id
        };
      });
    }
    return [];
  }
  getTotalCreditHours(data: any): number {
    if (data.couse && data.couse.length > 0) {
      return data.couse.reduce((sum, course) => sum + course.creditHours, 0);
    }
    return 0;
  }
  getTotalAssignedInstructors(data: any): number {
    if (data.couse && data.couse.length > 0) {
      return data.couse.reduce(
        (sum, course) => sum + course.noOfAssignedInstructor,
        0
      );
    }
    return 0;
  }
  openModal(data: any): void {
    const modal: NzModalRef = this.modal.create({
      nzTitle: null,
      nzContent: CourseOfferingInstructorAssignmentComponent,
      nzComponentParams: {
        courseId: data.courseId,
        courseOfferingId: data.courseOfferingId
      },
      nzMaskClosable: false,
      nzFooter: null,
      nzWidth: "800px",
      nzStyle: { 'padding-bottom': '0' }
    });
    modal.afterClose.subscribe(() => {
      this.fetchProgram();
    });
  }
  trackById(index: number, item: any) {
    return item.id;
  }
  trackByCourseId(index: number, item: any) {
    return item.courseId;
  }

  onIsActiveFilterChange(value: boolean | null): void {
    this.isActiveFilter = value;
    if (this.hasAppliedFilters) {
      this.pager.resetPage();
    }
  }
}
