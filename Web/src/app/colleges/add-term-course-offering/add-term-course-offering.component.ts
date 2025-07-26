import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { AbstractControl, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { CurriculumQuadrantBreakdownService } from "src/app/graduation-requirement/services/curriculum-quadrant-breakdown.service";
import { CustomNotificationService } from "src/app/services/custom-notification.service";
import { TermCourseOfferingService } from "../services/term-course-offering.service";
import {
  CourseBreakDownOffering,
  StaticData
} from "src/app/admission-request/model/StaticData";
import {
  ACADEMIC_TERM_STATUS,
  ACADEMIC_YEAR_NUMBER_STATUS
} from "src/app/common/constant";
import { TermCourseOfferingRequest } from "../model/term-course-offering-request.model";
import { BatchTermService } from "../services/batch-term.service";

@Component({
  selector: "app-add-term-course-offering",
  templateUrl: "./add-term-course-offering.component.html",
  styleUrls: ["./add-term-course-offering.component.scss"],
  encapsulation: ViewEncapsulation.None
})
export class AddTermCourseOfferingComponent implements OnInit {
  action = "Add Term Course Offering";
  termCourseOfferingForm: FormGroup;
  curricula: any;
  courses: any[] = [];
  staffs: any;
  entries: any;
  academicTerms: any;
  batchs: any[] = [];
  progStatusId: any;
  submit = "Save";
  listOfTermNumber: StaticData[] = [];
  listOfSelectedValue = [];
  listOfSelectedCourseBreakdown = [];
  listOfYearNumber: StaticData[] = [];
  listOfCourseBreakDown: CourseBreakDownOffering[] = [];
  academicTermYear = 0;
  academicTermSeason = 0;
  academicTermId = 0;
  id = "";
  numberOfCourseBreakDown = 0;
  checked = false;
  setOfCheckedId = new Set<string>();
  listOfCurrentPageData: readonly any[] = [];
  indeterminate = false;
  loading = false;

  checkedA = false;
  setOfCheckedIdA = new Set<string>();
  listOfCurrentPageDataA: readonly any[] = [];
  indeterminateA = false;
  loadingA = false;
  yearList: number[] = [];
  currentYear = new Date();
  curriculumCodes: string;
  coursesId: string[] = []
  savedAdditionalCourseIds: string[] = []

  searchText = '';
  originalCourses: any;

  searchTextB = '';
  originalBCourses: any;
  entryYear = 0;
  currentTerm = '';
  currentAcademicTerm: any;
  nextAcademicTerm: any;
  nextTerm = '';
  nextTermYear: number;
  batchId: string;
  startDate: any;
  endDate: any;
  isUpdate = false;
  
  // Add flags to track data loading state
  private isDataLoaded = false;
  private isFormInitialized = false;
  private pendingBatchSelection: string | null = null;

  constructor(
    public activeRoute: ActivatedRoute,
    private _route: Router,
    private _fb: FormBuilder,
    private _customNotificationService: CustomNotificationService,
    private _curriculumQuadrantBreakdownService: CurriculumQuadrantBreakdownService,
    private _termCourseOfferingService: TermCourseOfferingService,
    private router: Router,
    private batchTermService: BatchTermService
  ) {
    this.getBatchList();
    this.getListOfAcademicTermStatus();
    const next = sessionStorage.getItem('nextAcademicTerm');
    this.nextAcademicTerm = next ? JSON.parse(next) : null;
    if (this.nextAcademicTerm) {
      this.academicTermId = this.nextAcademicTerm.id;
      this.nextTermYear = this.nextAcademicTerm.year;
      this.startDate = this.nextAcademicTerm.startDate;
      this.endDate = this.nextAcademicTerm.endDate;
      this.nextTerm = this.getAcademicTermStatusDescription(this.nextAcademicTerm.termId);
    }
    this.createCourseOffering();
    this.yearList = this.getYearRange(this.currentYear.getFullYear());
  }

  ngOnInit(): void {
    this.progStatusId = this.activeRoute.snapshot.paramMap.get("id");
    if (this.progStatusId != "null") {
      this.isUpdate = true;
      this.action = "Edit Term Course Offering";
      this.submit = "Update";
    }
    
    // Set up batch selection listener
    this.batchCode.valueChanges.subscribe(res => {
      if (res) {
        this.onBatchSelect(res);
      }
    });

    this.getCurrentAcademicTerm();
    this.getAcademicTermsList();
    this.getStaffsList();
    this.getListOfYearNumberStatus();

    if (this.progStatusId != "null") {
      this.getTermCourseOfferingById(this.progStatusId);
    }

    this.setOfCheckedId = new Set<string>();
    this.setOfCheckedIdA = new Set<string>();
  }

  ngAfterViewInit(): void {
    //  this.getCourseList();
  }
  
  getCurrentAcademicTerm() {
    this.batchTermService.getCurrentAcademicTerm().subscribe((res: any) => {
      this.currentAcademicTerm = res;
      this.currentTerm = this.getAcademicTermStatusDescription(res.termId);
    });
  }
  
  getNextAcademicTerm() {
    this.batchTermService.getNextAcademicTerm().subscribe((res: any) => {
      this.nextAcademicTerm = res;
      this.academicTermId = res.id;
      this.nextTermYear = res.year;
      this.nextTerm = this.getAcademicTermStatusDescription(res.termId);
    });
  }
  
  getAcademicTermStatusDescription(Id: any) {
    const program = this.listOfTermNumber.find(item => item.Id == Id);
    return program ? program.Description : "";
  }
  
  getCourseBreakDownListByBatch(curriculumCode: string, termId: number, batchId: string, isUpdate: boolean) {
    this.batchTermService
      .getCourseBreakDownList(curriculumCode, termId, batchId, isUpdate)
      .subscribe((res: any) => {
        this.listOfCourseBreakDown = res.courseBreakDownOffering;
        this.originalBCourses = [...this.listOfCourseBreakDown];
        this.numberOfCourseBreakDown = this.listOfCourseBreakDown.length;
        
        // Handle course selection for update mode
        if (isUpdate && this.coursesId && this.coursesId.length > 0) {
          // Filter courses that are in the breakdown
          const breakdownCourseIds = this.listOfCourseBreakDown.map(x => x.courseId);
          const selectedBreakdownCourses = this.coursesId.filter(id => 
            breakdownCourseIds.includes(id)
          );
          
          // Set checked state for breakdown courses
          selectedBreakdownCourses.forEach(courseId => {
            this.setOfCheckedId.add(courseId);
          });
          
          // Update saved additional course IDs to exclude breakdown courses
          this.savedAdditionalCourseIds = this.coursesId.filter(courseId => 
            !breakdownCourseIds.includes(courseId)
          );
        }
        
        // Patch form with breakdown courses
        let course = this.listOfCourseBreakDown.map(x => x.courseId);
        this.courseId.patchValue(course);
        
        this.termCourseOfferingForm.patchValue({
          AcademicTermSeason: res.currentTerm,
          AcademicTermYear: res.academicYear
        });
        
        this.refreshCheckedStatus();
      });
  }
  
  getTermCourseOfferingById(id: string) {
    this._termCourseOfferingService
      .getTermCourseOfferingById(id)
      .subscribe((res: any) => {
        console.log("Course Offering", res.data);
        this.coursesId = res.data.courseId || [];
        this.savedAdditionalCourseIds = [...this.coursesId];
        
        // Patch form values first
        this.patchValues(res.data);
        
        // If batch is already selected, load course data
        if (this.batchCode.value) {
          this.loadCourseData();
        } else {
          // Store pending batch selection
          this.pendingBatchSelection = res.data.batchCode;
        }
      });
  }

  private loadCourseData() {
    if (this.curriculumCodes && this.batchId && this.academicTermId !== undefined) {
      this.getCourseBreakDownListByBatch(this.curriculumCodes, this.academicTermId, this.batchId, this.isUpdate);
      this.getAllCourseByBatchId(this.curriculumCodes, this.batchId, this.isUpdate, this.academicTermId);
    }
  }

  private createCourseOffering() {
    this.termCourseOfferingForm = this._fb.group({
      createdBy: ["-"],
      lastModifiedBy: ["-"],
      AcademicTermSeason: ["", [Validators.required]],
      AcademicTermYear: [0, [Validators.required]],
      academicTermCode: ["", []],
      entryCode: ["", [Validators.required]],
      batchCode: ["", [Validators.required]],
      courseId: ["", [Validators.required]],
      addtionalCourseId: ["", []],
      approvedDate: [null, []],
      Year: [this.currentYear.getFullYear(), []],
      curriculumCode: ["", []],
      remark: [""],
      RegistrationStartDate: [this.nextAcademicTerm?.startDate, [Validators.required]],
      RegistrationEndDate: [this.nextAcademicTerm?.endDate, [Validators.required]]
    },
      {
        Validators: this.dateRangeValidator('RegistrationStartDate', 'RegistrationEndDate')
      }
    );
  }
  
  private getTermCourseOffering(): TermCourseOfferingRequest {
    const formModel = this.termCourseOfferingForm.getRawValue();
    const course = new TermCourseOfferingRequest();
    course.ID = this.id;
    course.AcademicTermSeason = formModel.AcademicTermSeason;
    course.AcademicTermYear = formModel.AcademicTermYear;
    course.BatchCode = formModel.batchCode;
    course.CurriculumCode = formModel.curriculumCode;
    course.EntryYear = this.entryYear;
    course.RegistrationStartDate = formModel.RegistrationStartDate;
    course.RegistrationEndDate = formModel.RegistrationEndDate;
    course.Year = formModel.Year;
    course.Remark = formModel.remark;
    return course;
  }
  
  //getter and setter
  get curriculumCode() {
    return this.termCourseOfferingForm.get("curriculumCode");
  }
  get addtionalCourseId() {
    return this.termCourseOfferingForm.get("addtionalCourseId");
  }
  get courseId() {
    return this.termCourseOfferingForm.get("courseId");
  }
  get batchCode() {
    return this.termCourseOfferingForm.get("batchCode");
  }
  get AcademicTermSeason() {
    return this.termCourseOfferingForm.get("AcademicTermSeason");
  }
  get AcademicTermYear() {
    return this.termCourseOfferingForm.get("AcademicTermYear");
  }
  get academicTermCode() {
    return this.termCourseOfferingForm.get("academicTermCode");
  }
  get entryCode() {
    return this.termCourseOfferingForm.get("entryCode");
  }

  get RegistrationStartDate() {
    return this.termCourseOfferingForm.get("RegistrationStartDate");
  }

  get RegistrationEndDate() {
    return this.termCourseOfferingForm.get("RegistrationEndDate");
  }

  // Getter to check if submit button should be disabled
  get isSubmitDisabled(): boolean {
    // Check if form is valid
    const isFormValid = this.termCourseOfferingForm.valid;
    
    // Check if any courses are selected (either breakdown or additional courses)
    const hasSelectedBreakdownCourses = this.setOfCheckedId.size > 0;
    const hasSelectedAdditionalCourses = this.setOfCheckedIdA.size > 0;
    const hasSelectedCourses = hasSelectedBreakdownCourses || hasSelectedAdditionalCourses;
    
    // Check if required form fields are filled
    const hasRequiredFields = this.batchCode?.value && 
                             this.AcademicTermSeason?.value && 
                             this.AcademicTermYear?.value &&
                             this.RegistrationStartDate?.value &&
                             this.RegistrationEndDate?.value;
    
    // Button is disabled if form is invalid OR no courses selected OR required fields missing
    return !isFormValid || !hasSelectedCourses || !hasRequiredFields;
  }

  // Getter to provide feedback about why the button is disabled
  get submitButtonTooltip(): string {
    if (!this.termCourseOfferingForm.valid) {
      return 'Please fill in all required fields';
    }
    
    const hasSelectedBreakdownCourses = this.setOfCheckedId.size > 0;
    const hasSelectedAdditionalCourses = this.setOfCheckedIdA.size > 0;
    const hasSelectedCourses = hasSelectedBreakdownCourses || hasSelectedAdditionalCourses;
    
    if (!hasSelectedCourses) {
      return 'Please select at least one course from the breakdown or additional courses';
    }
    
    const hasRequiredFields = this.batchCode?.value && 
                             this.AcademicTermSeason?.value && 
                             this.AcademicTermYear?.value &&
                             this.RegistrationStartDate?.value &&
                             this.RegistrationEndDate?.value;
    
    if (!hasRequiredFields) {
      return 'Please fill in all required fields (Batch, Academic Term Season, Academic Term Year, Registration Start Date, Registration End Date)';
    }
    
    return '';
  }

  // Getter to check if courses are selected
  get hasSelectedCourses(): boolean {
    const hasSelectedBreakdownCourses = this.setOfCheckedId.size > 0;
    const hasSelectedAdditionalCourses = this.setOfCheckedIdA.size > 0;
    return hasSelectedBreakdownCourses || hasSelectedAdditionalCourses;
  }

  // Getter to check if required fields are filled
  get hasRequiredFields(): boolean {
    return this.batchCode?.value && 
           this.AcademicTermSeason?.value && 
           this.AcademicTermYear?.value &&
           this.RegistrationStartDate?.value &&
           this.RegistrationEndDate?.value;
  }

  submitForm() {
    const selectedCourseBreakDownIds = this.listOfCourseBreakDown
      .filter(data => this.setOfCheckedId.has(data.courseId))
      .map(data => data.courseId);
    const selectedCourseIds = this.courses
      .filter(data => this.setOfCheckedIdA.has(data.courseId))
      .map(data => data.courseId);
    const uniqueCourseId = selectedCourseIds.filter(
      courseId => !this.listOfSelectedCourseBreakdown.includes(courseId)
    );
    const listOfSelectedCouresOffering = selectedCourseBreakDownIds.concat(
      ...uniqueCourseId
    );
    const postData = this.getTermCourseOffering();
    postData.CourseId = listOfSelectedCouresOffering;

    if (this.progStatusId == "null") {
      this._termCourseOfferingService.create(postData).subscribe(res => {
        if (res.status == "success") {
          this._customNotificationService.notification(
            "success",
            "Success",
            res.data
          );
          this._route.navigateByUrl("colleges/term-course-offering");
        } else if (res.status == "depulicate") {

        }
      });
    } else if (this.progStatusId != "null") {
      this._termCourseOfferingService
        .update(this.progStatusId, postData)
        .subscribe(res => {
          if (res.status == "success") {
            this._customNotificationService.notification(
              "success",
              "Success",
              res.data
            );
            this._route.navigateByUrl("colleges/term-course-offering");
          } else {
            this._customNotificationService.notification(
              "error",
              "Error",
              res.data
            );
          }
        });
    }
  }
  
  patchValues(data: any) {
    this.termCourseOfferingForm.patchValue({
      academicTermCode: data.academicTermCode,
      curriculumCode: data.curriculumCode,
      entryCode: data.entryCode,
      batchCode: data.batchCode,
      courseCode: data.courseCode,
      approvedDate: data.approvedDate,
      remark: data.remark,
      AcademicTermSeason: data.academicTermSeason,
      AcademicTermYear: data.academicTermYear,
      RegistrationStartDate: data.registrationStartDate,
      RegistrationEndDate: data.registrationEndDate
    });
  }
  
  getCourseList() {
    this._curriculumQuadrantBreakdownService
      .getCourseList()
      .subscribe((res: any) => {
        this.courses = res
        this.originalCourses = [...this.courses]
      });
  }

  getBatchList() {
    this._termCourseOfferingService.getBatchList().subscribe((res: any) => {
      this.batchs = res.data;
      
      // If we have a pending batch selection from update mode, set it now
      if (this.pendingBatchSelection) {
        this.batchCode.patchValue(this.pendingBatchSelection);
        this.pendingBatchSelection = null;
      }
    });
  }
  
  getAcademicTermsList() {
    this._termCourseOfferingService
      .getAcademicTermList()
      .subscribe((res: any) => {
        this.academicTerms = res.data;
      });
  }

  getEntryList() {
    this._termCourseOfferingService.getEntryList().subscribe((res: any) => {
      this.entries = res.data;
    });
  }

  getStaffsList() {
    this._termCourseOfferingService.getStaffList().subscribe((res: any) => {
      this.staffs = res.data;
    });
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
  
  onBatchSelect(selectedBatchCode: string) {
    const selectedBatch = this.batchs.find(
      batch => batch.batchCode === selectedBatchCode
    );
    if (selectedBatch) {
      this.curriculumCodes = selectedBatch.curriculumCode;
      this.entryYear = selectedBatch.entryYear;
      this.batchId = selectedBatch.id;
      this.termCourseOfferingForm
        .get("curriculumCode")
        .patchValue(this.curriculumCodes);
      this.termCourseOfferingForm
        .get("entryCode")
        .patchValue(selectedBatch.entryYear);
        
      // Load course data after batch selection
      this.loadCourseData();
    }
  }
  
  getCourseBreakDownList(
    curriculumId: string,
    seasonTerm: number,
    termYear: number
  ) {
    this._termCourseOfferingService
      .getCourseBreakDownList(curriculumId, seasonTerm, termYear)
      .subscribe(res => {
        this.numberOfCourseBreakDown = res.length;
        if (res) {
          this.listOfCourseBreakDown = res;
          this.originalBCourses = [...this.listOfCourseBreakDown];
          this.numberOfCourseBreakDown = this.listOfCourseBreakDown.length;
          let course = this.listOfCourseBreakDown.map(x => x.courseId);
          this.courseId.patchValue(course);
        }
      });
  }
  
  getTotalCreditHours() {
    return this.listOfCourseBreakDown.reduce(
      (total, data) => total + data.creditHours,
      0
    );
  }

  getSelectedCreditHours() {
    return this.listOfCourseBreakDown
      .filter(data => this.setOfCheckedId.has(data.courseId))
      .reduce((total, data) => total + data.creditHours, 0);
  }

  getTotalCreditsForCourses() {
    return this.courses?.reduce(
      (total, course) => total + (course.creditHours || 0),
      0
    ) || 0;
  }

  getSelectedAdditionalCreditHours() {
    return this.courses
      ?.filter(course => this.setOfCheckedIdA.has(course.courseId))
      .reduce((total, course) => total + (course.creditHours || 0), 0) || 0;
  }

  getDefaultEndDate(): Date {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + 7);
    return currentDate;
  }
  
  dateRangeValidator(startControlName: string, endControlName: string) {
    return (control: AbstractControl): { [key: string]: boolean } | null => {
      const startDate = control.get(startControlName)?.value;
      const endDate = control.get(endControlName)?.value;

      if (startDate && endDate && startDate > endDate) {
        return { 'dateRangeError': true };
      }

      return null;
    };
  }

  updateCheckedSetA(id: string, checked: boolean): void {
    if (checked) {
      this.setOfCheckedIdA.add(id);
    } else {
      this.setOfCheckedIdA.delete(id);
    }
  }

  refreshCheckedStatusA(): void {
    const listOfEnabledData = this.listOfCurrentPageDataA.filter(({ disabled }) => !disabled);
    this.checkedA = listOfEnabledData.every(({ id }) => this.setOfCheckedIdA.has(id));
    this.indeterminateA = listOfEnabledData.some(({ id }) => this.setOfCheckedIdA.has(id)) && !this.checkedA;
  }

  onItemCheckedA(id: string, checked: boolean): void {
    this.updateCheckedSetA(id, checked);
    this.refreshCheckedStatusA();
  }

  onAllCheckedA(checked: boolean): void {
    this.listOfCurrentPageDataA
      .filter(({ disabled }) => !disabled)
      .forEach(({ id }) => this.updateCheckedSetA(id, checked));
    this.refreshCheckedStatusA();
  }

  onCurrentPageDataChangeA(listOfCurrentPageData: readonly any[]): void {
    this.listOfCurrentPageDataA = listOfCurrentPageData;
    
    // Check saved additional courses when in update mode
    if (this.isUpdate && this.savedAdditionalCourseIds.length > 0) {
      this.setOfCheckedIdA.clear();
      this.savedAdditionalCourseIds.forEach(courseId => {
        const matchingItem = listOfCurrentPageData.find(item => item.courseId == courseId);
        if (matchingItem) {
          this.setOfCheckedIdA.add(matchingItem.courseId);
        }
      });
    }
    
    this.refreshCheckedStatusA();
  }

  updateCheckedSet(id: string, checked: boolean): void {
    if (checked) {
      this.setOfCheckedId.add(id);
    } else {
      this.setOfCheckedId.delete(id);
    }
  }

  refreshCheckedStatus(): void {
    const listOfEnabledData = this.listOfCurrentPageData.filter(({ disabled }) => !disabled);
    this.checked = listOfEnabledData.every(({ id }) => this.setOfCheckedId.has(id));
    this.indeterminate = listOfEnabledData.some(({ id }) => this.setOfCheckedId.has(id)) && !this.checked;
  }

  onItemChecked(id: string, checked: boolean): void {
    this.updateCheckedSet(id, checked);
    this.refreshCheckedStatus();
  }

  onAllChecked(checked: boolean): void {
    this.listOfCurrentPageData
      .filter(({ disabled }) => !disabled)
      .forEach(({ courseId }) => this.updateCheckedSet(courseId, checked));
    this.refreshCheckedStatus();
  }
  
  onCurrentPageDataChange(listOfCurrentPageData: readonly any[]): void {
    this.listOfCurrentPageData = listOfCurrentPageData;
    this.setOfCheckedId.clear();
    
    // In update mode, check courses that were previously selected
    if (this.isUpdate && this.coursesId && this.coursesId.length > 0) {
      this.coursesId.forEach(courseId => {
        const matchingItem = listOfCurrentPageData.find(item => item.courseId == courseId);
        if (matchingItem) {
          this.setOfCheckedId.add(matchingItem.courseId);
        }
      });
    }
    
    this.refreshCheckedStatus();
  }
  
  getYearRange(CurrentYear: number) {
    const YeaList = [];
    const startYear = CurrentYear - 15;
    for (let i = startYear; i <= CurrentYear; i++) {
      YeaList.push(i);
    }
    return YeaList.reverse();
  }
  
  doAction(): void {
    this.router.navigateByUrl(`curricula/curriculum-break-down-form`);
  }
  
  goToCurriculum() {
    this.router.navigateByUrl(`/colleges/term-course-offering`);
  }
  
  onSearch(): void {
    if (!this.courses) {
      this.courses = [];
    }
    if (this.searchText.trim() === '') {
      this.courses = [...this.originalCourses];
    } else {
      this.courses = this.courses.filter(item =>
        item.courseCode.includes(this.searchText) ||
        item.courseTitle.toLowerCase().includes(this.searchText.toLowerCase())
      );
    }
    
    // If in update mode, ensure saved courses remain checked after search
    if (this.isUpdate && this.savedAdditionalCourseIds.length > 0) {
      this.savedAdditionalCourseIds.forEach(courseId => {
        const matchingItem = this.courses.find(item => item.courseId == courseId);
        if (matchingItem) {
          this.setOfCheckedIdA.add(matchingItem.courseId);
        }
      });
    }
    
    this.refreshCheckedStatusA();
  }
  
  onSearchBreak(): void {
    if (this.searchTextB.trim() === '') {
      this.listOfCourseBreakDown = [...this.originalBCourses];
    } else {
      this.listOfCourseBreakDown = this.listOfCourseBreakDown.filter(item =>
        item.courseCode.includes(this.searchTextB) ||
        item.courseTitle.toLowerCase().includes(this.searchTextB.toLowerCase())
      );
    }
    this.refreshCheckedStatus();
  }
  
  getAllCourseByBatchId(curriculumId: string, batchId: string, isUpdate: boolean, seasonTerm: number) {
    this.batchTermService
      .getAllCourseByBatchId(curriculumId, batchId, isUpdate, seasonTerm)
      .subscribe((res: any) => {
        this.courses = res;
        this.originalCourses = [...this.courses];
        
        // If in update mode and we have saved additional course IDs, check them
        if (isUpdate && this.savedAdditionalCourseIds.length > 0) {
          // Filter out courses that are already in the breakdown list
          const additionalCourses = this.savedAdditionalCourseIds.filter(courseId => {
            return !this.listOfCourseBreakDown.some(breakdown => breakdown.courseId === courseId);
          });
          
          // Update the saved additional course IDs to only include those not in breakdown
          this.savedAdditionalCourseIds = additionalCourses;
          
          // Set checked state for additional courses
          this.savedAdditionalCourseIds.forEach(courseId => {
            this.setOfCheckedIdA.add(courseId);
          });
        }
        
        this.refreshCheckedStatusA();
      });
  }
}
