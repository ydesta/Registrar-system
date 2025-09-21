import { Component, OnInit, ViewEncapsulation, ChangeDetectorRef, AfterViewInit, OnDestroy } from "@angular/core";
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
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: "app-add-term-course-offering",
  templateUrl: "./add-term-course-offering.component.html",
  styleUrls: ["./add-term-course-offering.component.scss"],
  encapsulation: ViewEncapsulation.None
})
export class AddTermCourseOfferingComponent implements OnInit, AfterViewInit, OnDestroy {
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
  
  // Caching properties to prevent change detection issues
  private _cachedAdditionalCreditHours: number | undefined;
  private _cachedAdditionalCreditHoursTimestamp: number | undefined;
  private _cachedCreditHours: number | undefined;
  private _cachedCreditHoursTimestamp: number | undefined;
  private _lastChangeDetectionTimestamp: number = Date.now();

  searchText = '';
  originalCourses: any;
  private searchSubject = new Subject<string>();

  searchTextB = '';
  originalBCourses: any;
  private searchBreakSubject = new Subject<string>();
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
  
  // Add flag to track pending batch selection
  private pendingBatchSelection: string | null = null;

  constructor(
    public activeRoute: ActivatedRoute,
    private _route: Router,
    private _fb: FormBuilder,
    private _customNotificationService: CustomNotificationService,
    private _curriculumQuadrantBreakdownService: CurriculumQuadrantBreakdownService,
    private _termCourseOfferingService: TermCourseOfferingService,
    private router: Router,
    private batchTermService: BatchTermService,
    private cdr: ChangeDetectorRef
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

    // Set up debounced search
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.searchText = searchTerm;
      this.performSearch();
    });

    this.searchBreakSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.searchTextB = searchTerm;
      this.performSearchBreak();
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
    
    // If we're in update mode and have pending course data, restore it now
    if (this.isUpdate && this.coursesId && this.coursesId.length > 0) {
      // Use setTimeout to ensure this runs after the current change detection cycle
      setTimeout(() => {
        this.restoreCourseSelections();
        this.cdr.detectChanges();
      });
    }
  }
  
  private restoreCourseSelections(): void {
    // Restore breakdown course selections
    if (this.listOfCourseBreakDown && this.listOfCourseBreakDown.length > 0) {
      this.setOfCheckedId.clear();
      this.coursesId.forEach(courseId => {
        const matchingCourse = this.listOfCourseBreakDown.find(course => course.courseId === courseId);
        if (matchingCourse) {
          this.setOfCheckedId.add(courseId);
        }
      });
    }
    
    // Restore additional course selections
    if (this.courses && this.courses.length > 0) {
      this.setOfCheckedIdA.clear();
      this.savedAdditionalCourseIds.forEach(courseId => {
        const matchingCourse = this.courses.find(course => course.courseId === courseId);
        if (matchingCourse) {
          this.setOfCheckedIdA.add(courseId);
        }
      });
    }
    
    this.invalidateCache();
  }
  
  ngOnDestroy(): void {
    // Clean up any pending operations
    this.loading = false;
    this.setOfCheckedId.clear();
    this.setOfCheckedIdA.clear();
    this.invalidateCache();
    
    // Clean up search subjects
    this.searchSubject.complete();
    this.searchBreakSubject.complete();
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
      .subscribe({
        next: (res: any) => {
          console.log('Received course breakdown:', res);
          this.listOfCourseBreakDown = res.courseBreakDownOffering;
          this.originalBCourses = [...this.listOfCourseBreakDown];
          this.numberOfCourseBreakDown = this.listOfCourseBreakDown.length;
          
          // Debug: Log sample breakdown course data structure
          if (this.listOfCourseBreakDown && this.listOfCourseBreakDown.length > 0) {
            console.log('Sample breakdown course data:', this.listOfCourseBreakDown[0]);
            console.log('Breakdown course code type:', typeof this.listOfCourseBreakDown[0].courseCode);
            console.log('Breakdown course title type:', typeof this.listOfCourseBreakDown[0].courseTitle);
          }
          
          // Handle course selection for update mode
          if (isUpdate && this.coursesId && this.coursesId.length > 0) {
            // Clear previous selections
            this.setOfCheckedId.clear();
            
            // Check courses that are in the breakdown and were previously selected
            this.listOfCourseBreakDown.forEach(course => {
              if (this.coursesId.includes(course.courseId)) {
                this.setOfCheckedId.add(course.courseId);
              }
            });
            
            // Update saved additional course IDs to exclude breakdown courses
            this.savedAdditionalCourseIds = this.coursesId.filter(courseId => 
              !this.listOfCourseBreakDown.some(breakdown => breakdown.courseId === courseId)
            );
          }
          
          // Patch form with breakdown courses (this is for display purposes only)
          let course = this.listOfCourseBreakDown.map(x => x.courseId);
          this.courseId.patchValue(course);
          
          this.termCourseOfferingForm.patchValue({
            AcademicTermSeason: res.currentTerm,
            AcademicTermYear: res.academicYear
          });
          
          this.invalidateCache();
          this.refreshCheckedStatus();
        },
        error: (error) => {
          console.error('Error fetching course breakdown:', error);
          this._customNotificationService.notification(
            "error",
            "Error",
            "Failed to load course breakdown data. Please try again."
          );
        }
      });
  }
  
  getTermCourseOfferingById(id: string) {
    this._termCourseOfferingService
      .getTermCourseOfferingById(id)
      .subscribe({
        next: (res: any) => {
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
          
          // Delay course selection restoration to avoid change detection issues
          setTimeout(() => {
            this.cdr.detectChanges();
          });
        },
        error: (error) => {
          console.error('Error fetching course offering:', error);
          this._customNotificationService.notification(
            "error",
            "Error",
            "Failed to load course offering data. Please try again."
          );
        }
      });
  }

  private loadCourseData() {
    console.log('loadCourseData called with:', {
      curriculumCodes: this.curriculumCodes,
      batchId: this.batchId,
      academicTermId: this.academicTermId,
      isUpdate: this.isUpdate
    });
    
    if (this.curriculumCodes && this.batchId && this.academicTermId !== undefined) {
      console.log('Loading course data...');
      this.getCourseBreakDownListByBatch(this.curriculumCodes, this.academicTermId, this.batchId, this.isUpdate);
      // For additional courses, always pass isUpdate as true to get all available courses
      this.getAllCourseByBatchId(this.curriculumCodes, this.batchId, true, this.academicTermId);
    } else {
      console.log('Missing required data for loading course data');
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
      courseId: ["", []], // Course selection is optional
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

  // Getter to check if submit button should be enabled
  get isSubmitDisabled(): boolean {
    try {
      // Check if form is valid
      const isFormValid = this.termCourseOfferingForm.valid;
      
      // Check if required form fields are filled
      const hasRequiredFields = this.batchCode?.value && 
                               this.AcademicTermSeason?.value && 
                               this.AcademicTermYear?.value &&
                               this.RegistrationStartDate?.value &&
                               this.RegistrationEndDate?.value;
      
      // Button is disabled if form is invalid OR required fields missing
      // Note: Course selection is optional - users can submit without selecting courses
      return !isFormValid || !hasRequiredFields;
    } catch (error) {
      console.warn('Error in isSubmitDisabled getter:', error);
      return true; // Default to disabled if there's an error
    }
  }







  submitForm() {
    // Prevent multiple submissions
    if (this.loading) {
      return;
    }
    
    // Validate form (course selection is optional)
    if (!this.termCourseOfferingForm.valid) {
      this._customNotificationService.notification(
        "error",
        "Validation Error",
        "Please fill in all required fields"
      );
      return;
    }
    
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
    
    // Note: Course selection is optional - users can submit without selecting courses
    // If no courses are selected, an empty array will be sent
    
    this.loading = true;
    const postData = this.getTermCourseOffering();
    postData.CourseId = listOfSelectedCouresOffering;

    if (this.progStatusId == "null") {
      this._termCourseOfferingService.create(postData).subscribe({
        next: (res) => {
          this.loading = false;
          if (res.status == "success") {
            this._customNotificationService.notification(
              "success",
              "Success",
              res.data
            );
            this._route.navigateByUrl("colleges/term-course-offering");
          } else if (res.status == "depulicate") {
            this._customNotificationService.notification(
              "warning",
              "Duplicate Entry",
              "This course offering already exists"
            );
          }
        },
        error: (error) => {
          this.loading = false;
          console.error('Error creating course offering:', error);
          this._customNotificationService.notification(
            "error",
            "Error",
            "Failed to create course offering. Please try again."
          );
        }
      });
    } else if (this.progStatusId != "null") {
      this._termCourseOfferingService
        .update(this.progStatusId, postData)
        .subscribe({
          next: (res) => {
            this.loading = false;
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
          },
          error: (error) => {
            this.loading = false;
            console.error('Error updating course offering:', error);
            this._customNotificationService.notification(
              "error",
              "Error",
              "Failed to update course offering. Please try again."
            );
          }
        });
    }
  }
  
  patchValues(data: any) {
    // First patch the basic form values
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

    // Handle courseId array properly - this should be an array of course IDs
    if (data.courseId && Array.isArray(data.courseId)) {
      this.coursesId = [...data.courseId];
      this.savedAdditionalCourseIds = [...data.courseId];
    } else if (data.courseId) {
      // Fallback: if courseId is not an array, convert it to one
      this.coursesId = [data.courseId];
      this.savedAdditionalCourseIds = [data.courseId];
    } else {
      this.coursesId = [];
      this.savedAdditionalCourseIds = [];
    }

    // Store the original course IDs for comparison
    this.savedAdditionalCourseIds = [...this.coursesId];
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

  get selectedCreditHours(): number {
    try {
      // Cache the result to prevent multiple evaluations during the same change detection cycle
      if (this._cachedCreditHours !== undefined && 
          this._cachedCreditHoursTimestamp === this._lastChangeDetectionTimestamp) {
        return this._cachedCreditHours;
      }
      
      const result = this.listOfCourseBreakDown
        .filter(data => this.setOfCheckedId.has(data.courseId))
        .reduce((total, data) => total + (data.creditHours || 0), 0);
      
      this._cachedCreditHours = result;
      this._cachedCreditHoursTimestamp = this._lastChangeDetectionTimestamp;
      return result;
    } catch (error) {
      console.warn('Error in selectedCreditHours getter:', error);
      return 0;
    }
  }

  getTotalCreditsForCourses() {
    return this.courses?.reduce(
      (total, course) => total + (course.creditHours || 0),
      0
    ) || 0;
  }

  get selectedAdditionalCreditHours(): number {
    try {
      // Cache the result to prevent multiple evaluations during the same change detection cycle
      if (this._cachedAdditionalCreditHours !== undefined && 
          this._cachedAdditionalCreditHoursTimestamp === this._lastChangeDetectionTimestamp) {
        return this._cachedAdditionalCreditHours;
      }
      
      const result = this.courses
        ?.filter(course => this.setOfCheckedIdA.has(course.courseId))
        .reduce((total, course) => total + (course.creditHours || 0), 0) || 0;
      
      this._cachedAdditionalCreditHours = result;
      this._cachedAdditionalCreditHoursTimestamp = this._lastChangeDetectionTimestamp;
      return result;
    } catch (error) {
      console.warn('Error in selectedAdditionalCreditHours getter:', error);
      return 0;
    }
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
    this.invalidateCache();
  }
  
  private invalidateCache(): void {
    this._lastChangeDetectionTimestamp = Date.now();
    this._cachedAdditionalCreditHours = undefined;
    this._cachedCreditHours = undefined;
  }

  refreshCheckedStatusA(): void {
    const listOfEnabledData = this.listOfCurrentPageDataA.filter(({ disabled }) => !disabled);
    this.checkedA = listOfEnabledData.every(({ id }) => this.setOfCheckedIdA.has(id));
    this.indeterminateA = listOfEnabledData.some(({ id }) => this.setOfCheckedIdA.has(id)) && !this.checkedA;
  }

  onItemCheckedA(id: string, checked: boolean): void {
    this.updateCheckedSetA(id, checked);
    this.refreshCheckedStatusA();
    this.cdr.detectChanges();
  }

  onAllCheckedA(checked: boolean): void {
    this.listOfCurrentPageDataA
      .filter(({ disabled }) => !disabled)
      .forEach(({ id }) => this.updateCheckedSetA(id, checked));
    this.refreshCheckedStatusA();
    this.cdr.detectChanges();
  }

  onCurrentPageDataChangeA(listOfCurrentPageData: readonly any[]): void {
    this.listOfCurrentPageDataA = listOfCurrentPageData;
    
    // Don't clear the checked set - only update the current page data
    // The checked state should persist across pagination changes
    
    this.invalidateCache();
    this.refreshCheckedStatusA();
  }

  updateCheckedSet(id: string, checked: boolean): void {
    if (checked) {
      this.setOfCheckedId.add(id);
    } else {
      this.setOfCheckedId.delete(id);
    }
    this.invalidateCache();
  }

  refreshCheckedStatus(): void {
    const listOfEnabledData = this.listOfCurrentPageData.filter(({ disabled }) => !disabled);
    this.checked = listOfEnabledData.every(({ id }) => this.setOfCheckedId.has(id));
    this.indeterminate = listOfEnabledData.some(({ id }) => this.setOfCheckedId.has(id)) && !this.checked;
  }

  onItemChecked(id: string, checked: boolean): void {
    this.updateCheckedSet(id, checked);
    this.refreshCheckedStatus();
    this.cdr.detectChanges();
  }

  onAllChecked(checked: boolean): void {
    this.listOfCurrentPageData
      .filter(({ disabled }) => !disabled)
      .forEach(({ courseId }) => this.updateCheckedSet(courseId, checked));
    this.refreshCheckedStatus();
    this.cdr.detectChanges();
  }
  
  onCurrentPageDataChange(listOfCurrentPageData: readonly any[]): void {
    this.listOfCurrentPageData = listOfCurrentPageData;
    
    // In update mode, check courses that were previously selected
    if (this.isUpdate && this.coursesId && this.coursesId.length > 0) {
      // Only check courses that are in the breakdown list
      const breakdownCourseIds = this.listOfCourseBreakDown.map(x => x.courseId);
      const selectedBreakdownCourses = this.coursesId.filter(id => 
        breakdownCourseIds.includes(id)
      );
      
      // Don't clear the entire set, just update based on current page
      selectedBreakdownCourses.forEach(courseId => {
        const matchingItem = listOfCurrentPageData.find(item => item.courseId == courseId);
        if (matchingItem) {
          this.setOfCheckedId.add(matchingItem.courseId);
        }
      });
    }
    
    this.invalidateCache();
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
    this.searchSubject.next(this.searchText);
  }

  performSearch(): void {
    console.log('Search triggered with text:', this.searchText);
    console.log('Original courses:', this.originalCourses);
    
    if (!this.courses) {
      this.courses = [];
    }
    
    if (!this.originalCourses || this.originalCourses.length === 0) {
      console.log('No original courses available');
      return;
    }
    
    if (this.searchText.trim() === '') {
      this.courses = [...this.originalCourses];
      console.log('Empty search - showing all courses:', this.courses.length);
    } else {
      const searchTerm = this.searchText.toLowerCase().trim();
      console.log('Searching for:', searchTerm);
      
      this.courses = this.originalCourses.filter(item => {
        if (!item) return false;
        
        const courseCode = item.courseCode ? item.courseCode.toLowerCase() : '';
        const courseTitle = item.courseTitle ? item.courseTitle.toLowerCase() : '';
        
        const codeMatch = courseCode.includes(searchTerm);
        const titleMatch = courseTitle.includes(searchTerm);
        
        console.log(`Course: ${item.courseCode} - Code: "${courseCode}", Title: "${courseTitle}"`);
        console.log(`Code match: ${codeMatch}, Title match: ${titleMatch}`);
        
        return codeMatch || titleMatch;
      });
      
      console.log('Filtered courses:', this.courses.length);
    }
    
    // Don't clear checked states during search - they should persist
    // The checked state is maintained in setOfCheckedIdA regardless of filtering
    
    this.invalidateCache();
    this.refreshCheckedStatusA();
  }
  
  onSearchBreak(): void {
    this.searchBreakSubject.next(this.searchTextB);
  }

  performSearchBreak(): void {
    console.log('Breakdown search triggered with text:', this.searchTextB);
    console.log('Original breakdown courses:', this.originalBCourses);
    
    if (!this.originalBCourses || this.originalBCourses.length === 0) {
      console.log('No original breakdown courses available');
      return;
    }
    
    if (this.searchTextB.trim() === '') {
      this.listOfCourseBreakDown = [...this.originalBCourses];
      console.log('Empty breakdown search - showing all courses:', this.listOfCourseBreakDown.length);
    } else {
      const searchTerm = this.searchTextB.toLowerCase().trim();
      console.log('Searching breakdown for:', searchTerm);
      
      this.listOfCourseBreakDown = this.originalBCourses.filter(item => {
        if (!item) return false;
        
        const courseCode = item.courseCode ? item.courseCode.toLowerCase() : '';
        const courseTitle = item.courseTitle ? item.courseTitle.toLowerCase() : '';
        
        const codeMatch = courseCode.includes(searchTerm);
        const titleMatch = courseTitle.includes(searchTerm);
        
        console.log(`Breakdown Course: ${item.courseCode} - Code: "${courseCode}", Title: "${courseTitle}"`);
        console.log(`Code match: ${codeMatch}, Title match: ${titleMatch}`);
        
        return codeMatch || titleMatch;
      });
      
      console.log('Filtered breakdown courses:', this.listOfCourseBreakDown.length);
    }
    
    // If in update mode, ensure saved courses remain checked after search
    if (this.isUpdate && this.coursesId && this.coursesId.length > 0) {
      // Don't clear the entire set, just ensure current filtered items are checked
      this.coursesId.forEach(courseId => {
        const matchingItem = this.listOfCourseBreakDown.find(item => item.courseId == courseId);
        if (matchingItem) {
          this.setOfCheckedId.add(matchingItem.courseId);
        }
      });
    }
    
    this.invalidateCache();
    this.refreshCheckedStatus();
  }
  
  getAllCourseByBatchId(curriculumId: string, batchId: string, isUpdate: boolean, seasonTerm: number) {
    this.batchTermService
      .getAllCourseByBatchId(curriculumId, batchId, isUpdate, seasonTerm)
      .subscribe({
        next: (res: any) => {
          console.log('Received additional courses:', res);
          this.courses = res;
          this.originalCourses = [...this.courses];
          
          // Debug: Log sample course data structure
          if (this.courses && this.courses.length > 0) {
            console.log('Sample course data:', this.courses[0]);
            console.log('Course code type:', typeof this.courses[0].courseCode);
            console.log('Course title type:', typeof this.courses[0].courseTitle);
          }
          
          // If in update mode and we have saved additional course IDs, restore them
          if (isUpdate && this.savedAdditionalCourseIds && this.savedAdditionalCourseIds.length > 0) {
            // Filter out courses that are already in the breakdown list
            const additionalCourses = this.savedAdditionalCourseIds.filter(courseId => {
              return !this.listOfCourseBreakDown.some(breakdown => breakdown.courseId === courseId);
            });
            
            // Update the saved additional course IDs to only include those not in breakdown
            this.savedAdditionalCourseIds = additionalCourses;
            
            // Restore checked state for additional courses (don't clear existing selections)
            this.savedAdditionalCourseIds.forEach(courseId => {
              const matchingCourse = this.courses.find(course => course.courseId === courseId);
              if (matchingCourse) {
                this.setOfCheckedIdA.add(courseId);
              }
            });
          }
          
          this.invalidateCache();
          this.refreshCheckedStatusA();
        },
        error: (error) => {
          console.error('Error fetching additional courses:', error);
          this._customNotificationService.notification(
            "error",
            "Error",
            "Failed to load additional course data. Please try again."
          );
        }
      });
  }
}
