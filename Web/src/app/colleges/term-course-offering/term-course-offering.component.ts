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

  pageindex = 1; // 1-based indexing for UI
  totalRecord = 0;
  pageSize = 10;
  pageSizeOption = [5, 10, 15, 25, 50, 100];
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
    console.log('Fetching with pageindex:', this.pageindex, 'pageSize:', this.pageSize);
    this._crudService
      .getList(
        `/TermCourseOfferings/paginated?searchKey=${this.searchKey}&pageindex=${this.pageindex - 1  // Convert 1-based UI index to 0-based API index
        }&pageSize=${this.pageSize}&sortColumn=${this.sortColumn}&sortOrder=${this.sortOrder
        }`
      )
      .subscribe((res: any) => {
        console.log('API Response:', res);
        console.log('Total records from API:', res.totalRowCount);
        console.log('Data length:', res.data ? res.data.length : 0);
        this.termCourseOfferings = res.data.map((item: any) => {
          const term = this.listOfTermNumber.find(t => t.Id === item.academicTermSeason);
          let courseDetails: any[] = [];
          let totalCreditHours = 0;
          let totalAssignedInstructors = 0;
          if (item.couse && item.couse.length > 0) {
            courseDetails = item.couse.map((c: any, index: number) => {
              totalCreditHours += c.creditHours || 0;
              totalAssignedInstructors += c.noOfAssignedInstructor || 0;
              
              // Debug: Log the original course object to see available properties
              console.log('Original course object:', c);
              console.log('Available properties in course:', Object.keys(c));
              console.log('Course ID type:', typeof c.id, 'Value:', c.id);
              console.log('Course offering ID type:', typeof c.courseOfferingId, 'Value:', c.courseOfferingId);
              
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
              console.log('Course detail mapped:', courseDetail);
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
        console.log('Mapped termCourseOfferings:', this.termCourseOfferings);
        console.log('termCourseOfferings length:', this.termCourseOfferings ? this.termCourseOfferings.length : 0);
        
        // Extract unique batch codes for filtering
        this.availableBatches = [...new Set(this.termCourseOfferings.map(item => item.batchCode).filter(batch => batch))];
        console.log('Available batches:', this.availableBatches);
        
        // Apply current filter
        this.applyBatchFilter();
        
        // Try different possible property names for total count
        this.totalRecord = res.totalRowCount || res.total || res.count || res.totalCount || (res.data ? res.data.length : 0);
        console.log('Setting totalRecord to:', this.totalRecord);
        console.log('Available properties in response:', Object.keys(res));
        this.tbLoading = false;
        // Don't override pageSize and pageindex from server response
        // as it can interfere with pagination state
      }, (error) => {
        this.tbLoading = false;
      });
  }

  onPageIndexChange(page: number): void {
    console.log('Page index changed to:', page);
    this.pageindex = page;
    this.fetchProgram();
  }

  onPageSizeChange(size: number): void {
    console.log('Page size changed to:', size);
    this.pageSize = size;
    this.pageindex = 1;
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
      nzOnCancel: () => console.log("Cancel")
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
      nzOnCancel: () => console.log("Cancel")
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
      nzOnCancel: () => console.log("Cancel")
    });
  }

  showDeactivateCourseOffering(id: number): void {
    console.log("%%$$      id", id);
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
      nzOnCancel: () => console.log("Cancel")
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
    console.log('Filtered results:', this.filteredTermCourseOfferings.length);
  }
}
