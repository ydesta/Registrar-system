import { Component, OnInit, OnDestroy } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { NzModalRef, NzModalService } from "ng-zorro-antd/modal";
import { BaseModel } from "src/app/Models/BaseMode";
import { StudentGradeModel } from "src/app/Models/StudentGradeModel";
import { TermCourseOfferingModel } from "src/app/Models/TermCourseOfferingModel";
import { StaticData } from "src/app/admission-request/model/StaticData";
import {
  ACADEMIC_TERM_STATUS,
  ACADEMIC_YEAR_NUMBER_STATUS
} from "src/app/common/constant";
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
  searchKey = "";
  checked = false;
  academicTerms: any;
  gradeQueryForm: FormGroup;
  studentId = "";
  debugTime = new Date().toLocaleString();

  // Pagination properties
  pageIndex = 1; // 1-based indexing for UI
  total = 0;
  pageSize = 10;
  pageSizeOptions = [5, 10, 15, 25, 50, 100];
  sortOrder = "";
  sortColumn = "";
  listOfTermNumber: StaticData[] = [];
  listOfYearNumber: StaticData[] = [];
  expandSet = new Set<string>();
  tbLoading = true;
  
  // Batch filtering properties
  searchBatch: string = "";
  availableBatches: string[] = [];
  filteredTermCourseOfferings: any[] = [];
  
  // Filter properties
  isActiveFilter: boolean | null = true; // Default to true (active only)
  yearFilter: number | null = null;
  yearOptions: number[] = [];

  constructor(
    private _customNotificationService: CustomNotificationService,
    private _crudService: CrudService,
    private _fb: FormBuilder,
    private modal: NzModalService,
    private termCourseOfferingService: TermCourseOfferingService
  ) {
    this.gradeQueryForm = this._fb.group({
      termCode: ["", Validators.required],
      studentId: [""]
    });
    
    // Generate year options (current year ± 10 years)
/*     const currentYear = new Date().getFullYear();
    for (let i = currentYear - 20; i <= currentYear + 50; i++) {
      this.yearOptions.push(i);
    } */
    for (let year = 1990; year <= 2100; year++) {
    this.yearOptions.push(year);
  }

  }

  ngOnInit(): void {
    this.getListOfAcademicTermStatus();
    this.getListOfYearNumberStatus();
    this.fetchProgram();
  }

  ngOnDestroy(): void {
  }
  // // populateIntialData() {
  // //   this._crudService
  // //     .getList("/academicTerms")
  // //     .subscribe((res: BaseModel<StudentGradeModel[]>) => {
  // //       this.academicTerms = res.data;
  // //       this.gradeQueryForm.value[
  // //         "termCode"
  // //       ] = this.academicTerms[0].academicTermCode;
  // //     });
  // }

  fetchProgram() {
    this.tbLoading = true;
    const isActiveParam = this.isActiveFilter !== null ? `&isActive=${this.isActiveFilter}` : '&isActive=true';
    const yearParam = this.yearFilter !== null ? `&year=${this.yearFilter}` : '';
    
    this._crudService
      .getList(
        `/TermCourseOfferings/paginated?searchKey=${this.searchKey}&pageindex=${this.pageIndex - 1}&pageSize=${this.pageSize}&sortColumn=${this.sortColumn}&sortOrder=${this.sortOrder}${isActiveParam}${yearParam}`
      )
      .subscribe((res: any) => {
        // Handle case where res.data might be null or undefined
        if (!res || !res.data) {
          this.termCourseOfferings = [];
          this.filteredTermCourseOfferings = [];
          this.total = 0;
          this.tbLoading = false;
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
              
              const courseDetail = {
                number: index + 1,
                title: c.courseTitle,
                code: c.courseCode,
                creditHours: c.creditHours,
                noOfAssignedInstructor: c.noOfAssignedInstructor,
                courseId: c.id,
                courseOfferingId: c.courseOfferingId || c.id, // Try to use courseOfferingId if available, fallback to course ID
                isActive: c.isActive !== undefined ? c.isActive : true // Default to true if not provided
              };
              return courseDetail;
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
        
        // Extract unique batch codes for filtering
        this.availableBatches = [...new Set(this.termCourseOfferings.map(item => item.batchCode).filter(batch => batch))];
        
        // Apply current filter
        this.applyBatchFilter();
        
        // Set total count from server response
        this.total = res.totalRowCount || res.total || res.count || res.totalCount || 0;
        this.tbLoading = false;
      }, (error) => {
        console.error('Error fetching term course offerings:', error);
        this.termCourseOfferings = [];
        this.filteredTermCourseOfferings = [];
        this.total = 0;
        this.tbLoading = false;
        this._customNotificationService.notification(
          'error',
          'Error',
          'Failed to load term course offerings. Please try again.'
        );
      });
  }

  onPageIndexChange(page: number): void {
    this.pageIndex = page;
    this.fetchProgram();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageIndex = 1; // Reset to first page when page size changes
    this.fetchProgram();
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
      // nzContent: '<b style="color: red;">Some descriptions</b>',
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


  clickSearchKey() {
    this.fetchProgram();
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
  // getCourseTitles(data: any): string[] {
  //   if (data.couse && data.couse.length > 0) {
  //     return data.couse.map((c, index) => `${index + 1}. ${c.courseTitle}`);
  //   }
  //   return [];
  // }
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
          courseOfferingId: c.id // Use the course ID (should be integer)
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
      nzTitle: null, // We'll use our custom header
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
  // For ngFor trackBy optimization
  trackById(index: number, item: any) {
    return item.id;
  }
  trackByCourseId(index: number, item: any) {
    return item.courseId;
  }

  // Batch filtering methods
  onBatchSearch(event: any): void {
    this.searchBatch = event.target.value;
    this.applyBatchFilter();
  }

  applyBatchFilter(): void {
    if (!this.searchBatch || this.searchBatch.trim() === '') {
      this.filteredTermCourseOfferings = [...this.termCourseOfferings];
    } else {
      const searchTerm = this.searchBatch.toLowerCase().trim();
      this.filteredTermCourseOfferings = this.termCourseOfferings.filter(
        item => item.batchCode && item.batchCode.toLowerCase().includes(searchTerm)
      );
    }
  }

  onIsActiveFilterChange(value: boolean | null): void {
    this.isActiveFilter = value;
    this.pageIndex = 1; // Reset to first page
    this.fetchProgram();
  }

  onYearFilterChange(value: number | null): void {
    this.yearFilter = value;
    this.pageIndex = 1; // Reset to first page
    this.fetchProgram();
  }
}
