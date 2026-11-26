import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy, TrackByFunction } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { TermCourseOfferingModel } from 'src/app/Models/TermCourseOfferingModel';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { StudentService } from '../../services/student.service';
import { StudentViewModel } from '../../models/student-view-model.model';
import { StaticData } from 'src/app/admission-request/model/StaticData';
import {
  ACADEMIC_TERM_STATUS,
  ACADEMIC_YEAR_NUMBER_STATUS,
  BANK_TO,
  RegistrationStatus,
} from 'src/app/common/constant';
import { SelectedCourses, StudentCourseOffering } from '../../models/student-course-offering.model';
import { Router } from '@angular/router';
import { BatchTermService } from 'src/app/colleges/services/batch-term.service';
import { studentRegistration } from '../../models/student-registration.model';
import { CourseBreakDownOffering } from '../../models/course-break-down-offering.model';
import * as html2pdf from 'html2pdf.js';
import { NzModalService } from 'ng-zorro-antd/modal';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, finalize, retry, timeout, catchError } from 'rxjs/operators';
import { PrintContentService } from 'src/app/services/print-content.service';
import {
  CourseRegistrationVisibility,
  DEFAULT_COURSE_REGISTRATION_VISIBILITY
} from 'src/app/Models/CourseRegistrationVisibility';
import { CgpaCreditHourLimitService } from 'src/app/colleges/services/cgpa-credit-hour-limit.service';
import { CgpaCreditHourLimitConfigModel } from 'src/app/Models/CgpaCreditHourLimitModel';

@Component({
  selector: 'app-student-course-registration',
  templateUrl: './student-course-registration.component.html',
  styleUrls: ['./student-course-registration.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StudentCourseRegistrationComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();
  private searchEquivalentSubject = new Subject<string>();
  private creditHourConfig: CgpaCreditHourLimitConfigModel = { isEnabled: false, limits: [] };

  get creditHourLimitsEnabled(): boolean {
    return !!this.creditHourConfig?.isEnabled;
  }

  get creditHourConfigAppliedLevel(): number {
    return this.creditHourConfig?.appliedLevel ?? 2;
  }

  get creditHourLimitSourceLabel(): string {
    switch (this.creditHourConfigAppliedLevel) {
      case 0:
        return 'Based on CGPA (Student)';
      case 1:
        return 'Based on CGPA (Batch)';
      case 3:
        return 'Based on CGPA (Global)';
      default:
        return 'Based on CGPA';
    }
  }

  gradeQueryForm: FormGroup;
  registrationForm: FormGroup;
  courseValidation: FormGroup;
  academicTerms: any;
  termCourseOfferings?: TermCourseOfferingModel[];
  studentTermCourseReg: StudentViewModel;
  studentRegisterdCourses?: any;
  studentId: string = '';
  applicantId: string = '';
  batchCode: string = '';
  uncheckedList: any = [];
  listOfCourseCode: studentRegistration[] = [];
  applicantUserId: string;
  listOfTermNumber: StaticData[] = [];
  listOfYearNumber: StaticData[] = [];
  checked = false;
  setOfCheckedId = new Set<string>();
  listOfCurrentPageData: readonly any[] = [];
  indeterminate = false;
  loading = false;
  isLoadingRegularCourses = false;
  isLoadingAddCourses = false;
  isLoadingAssessmentCourses = false;
  isSubmitting = false;
  season: number;
  havePreparedCourseOffering: boolean = false;
  registrationId: string;
  seasonTitles: string;
  resultStatus: number;
  listOfBankTo: StaticData[] = [];
  nextAcademicTerm: any;
  nextTerm = '';
  nextTermYear: number = 0;
  academicTermId = 0;
  courseSectionTitle = '';
  courseAddTitle = '';
  courseAssessmentTitle = '';
  courseEquivalentTitle = '';
  regId: string = null;
  listOfAddedCourses: CourseBreakDownOffering[] = [];
  checkedRegularCourses = false;
  indeterminateRegularCourses = false;
  searchAddCourseText: string = '';
  filteredAddCourses: CourseBreakDownOffering[] = [];
  checkedAddCourses = false;
  indeterminateAddCourses = false;
  setOfCheckedAddCourses = new Set<string>();
  coursePriorities = new Map<string, number>();
  maxAddCoursesAllowed = 3;
  listOfCourseAssessment: CourseBreakDownOffering[] = [];
  checkedAssessmentCourses = false;
  indeterminateAssessmentCourses = false;
  setOfCheckedAssessmentCourses = new Set<string>();
  selectedBatchCode: string = null;
  isGeneratingPDF = false;

  private retryCount = 0;
  private readonly MAX_RETRIES = 3;

  // Equivalent courses properties
  listOfEquivalentCourses: CourseBreakDownOffering[] = [];
  filteredEquivalentCourses: CourseBreakDownOffering[] = [];
  searchEquivalentCourseText: string = '';
  checkedEquivalentCourses = false;
  indeterminateEquivalentCourses = false;
  setOfCheckedEquivalentCourses = new Set<string>();
  isLoadingEquivalentCourses = false;
  registrationVisibility: CourseRegistrationVisibility = { ...DEFAULT_COURSE_REGISTRATION_VISIBILITY };

  // Sorting properties
  regularCoursesSortOrder: 'asc' | 'desc' | null = null;
  addCoursesSortOrder: 'asc' | 'desc' | null = null;
  assessmentCoursesSortOrder: 'asc' | 'desc' | null = null;
  equivalentCoursesSortOrder: 'asc' | 'desc' | null = null;
  constructor(
    private _customNotificationService: CustomNotificationService,
    private _studentService: StudentService,
    private batchTermService: BatchTermService,
    private _route: Router,
    private modal: NzModalService,
    private cdr: ChangeDetectorRef,
    private printContentService: PrintContentService,
    private cgpaCreditHourLimitService: CgpaCreditHourLimitService
  ) {
    this.searchSubject.pipe(
      takeUntil(this.destroy$),
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchText => {
      this.filterAddCourses();
    });

    this.searchEquivalentSubject.pipe(
      takeUntil(this.destroy$),
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchText => {
      this.filterEquivalentCourses();
    });
  }

  ngOnInit(): void {
    this.getListOfOfToBank();
    this.getListOfAcademicTermStatus();
    this.getListOfYearNumberStatus();

    const next = sessionStorage.getItem('nextAcademicTerm');
    this.nextAcademicTerm = next ? JSON.parse(next) : null;

    if (this.nextAcademicTerm) {
      this.initializeAcademicTerm();
      this.loadCreditHourConfig();
    } else {
      this.getNextAcademicTerm();
    }

    this.applicantUserId = localStorage.getItem('userId');
    if (this.applicantUserId && this.academicTermId) {
      this.resetAllStates();
      this.loadCourseData();
    }
  }

  private loadCreditHourConfig(): void {
    if (!this.academicTermId || !this.nextTermYear) {
      this.creditHourConfig = { isEnabled: false, limits: [] };
      return;
    }

    this.cgpaCreditHourLimitService
      .getConfig(
        this.academicTermId,
        this.nextTermYear,
        this.batchCode || this.studentTermCourseReg?.batchCode,
        this.studentTermCourseReg?.studId || this.studentId
      )
      .pipe(takeUntil(this.destroy$), catchError(() => of({ data: { isEnabled: false, limits: [] } })))
      .subscribe((res: any) => {
          this.creditHourConfig = {
          isEnabled: !!res?.data?.isEnabled,
          academicTerm: res?.data?.academicTerm,
          year: res?.data?.year,
          batchCode: res?.data?.batchCode,
          studentId: res?.data?.studentId,
          appliedLevel: res?.data?.appliedLevel,
          limits: res?.data?.limits || []
        };
        this.applyTemporaryCreditValidationOverride();
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeAcademicTerm(): void {
    this.academicTermId = this.nextAcademicTerm.termId;
    this.nextTermYear = this.nextAcademicTerm.year;
    const termDescription = this.getAcademicTermStatusDescription(this.nextAcademicTerm.termId);

    this.nextTerm = `🎓 Registration : ${termDescription} ${this.nextAcademicTerm.year}`;
    this.courseSectionTitle = `📘 Courses Available – ${termDescription} ${this.nextAcademicTerm.year}`;
    this.courseAddTitle = `📘 Courses Add Request – ${termDescription} ${this.nextAcademicTerm.year}`;
    this.courseAssessmentTitle = `📘 Courses Assessment – ${termDescription} ${this.nextAcademicTerm.year}`;
    this.courseEquivalentTitle = `📘 Equivalent Courses – ${termDescription} ${this.nextAcademicTerm.year}`;
    this.seasonTitles = this.nextTerm;
  }

  retryLoading(): void {
    this.loadCourseData();
  }

  private loadCourseData(): void {
    this.isLoadingRegularCourses = true;
    this.isLoadingAddCourses = true;
    this.isLoadingAssessmentCourses = true;
    this.isLoadingEquivalentCourses = true;

    const academicTermConfigId = this.nextAcademicTerm?.id;
    if (!academicTermConfigId) {
      this.resetLoadingStates();
      return;
    }

    this.batchTermService.getCourseRegistrationVisibility(academicTermConfigId).pipe(
      takeUntil(this.destroy$),
      catchError(() => of({
        data: { ...DEFAULT_COURSE_REGISTRATION_VISIBILITY, academicTermId: academicTermConfigId }
      }))
    ).subscribe({
      next: (res) => {
        this.registrationVisibility = this.mapRegistrationVisibility(res?.data, academicTermConfigId);
        this.loadVisibleCourseSections();
      }
    });
  }

  private mapRegistrationVisibility(data: any, academicTermConfigId: number): CourseRegistrationVisibility {
    if (!data) {
      return { ...DEFAULT_COURSE_REGISTRATION_VISIBILITY, academicTermId: academicTermConfigId };
    }

    return {
      academicTermId: data.academicTermId ?? academicTermConfigId,
      showRegular: data.showRegular !== false,
      showAdd: data.showAdd !== false,
      showAssessment: data.showAssessment !== false,
      showEquivalent: data.showEquivalent !== false,
      isConfigured: !!data.isConfigured
    };
  }

  private loadVisibleCourseSections(): void {
    const regularCourses$ = this._studentService.getStudentCourseOfferingId(
      this.applicantUserId,
      this.academicTermId,
      this.nextAcademicTerm.id
    ).pipe(catchError(() => of(null)));

    const addableCourses$ = this.registrationVisibility.showAdd
      ? this._studentService.getListOfAddableTermCourseOffering(
          this.applicantUserId,
          this.academicTermId,
          this.nextAcademicTerm.id
        ).pipe(catchError(() => of([])))
      : of([]);

    const assessmentCourses$ = this.registrationVisibility.showAssessment
      ? this._studentService.getListOfRetakeTermCourseOffering(
          this.applicantUserId,
          this.academicTermId,
          this.nextAcademicTerm.id
        ).pipe(catchError(() => of([])))
      : of([]);

    const equivalentCourses$ = this.registrationVisibility.showEquivalent
      ? this._studentService.getAddableCoursesWithEquivalentsAsync(
          this.applicantUserId,
          this.academicTermId,
          this.nextAcademicTerm.id
        ).pipe(catchError(() => of([])))
      : of([]);

    forkJoin({
      regularCourses: regularCourses$,
      addableCourses: addableCourses$,
      assessmentCourses: assessmentCourses$,
      equivalentCourses: equivalentCourses$
    }).pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.resetLoadingStates();
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (results) => {
        this.handleCourseData(results);
      },
      error: () => {
        this._customNotificationService.notification('error', 'Error',
          'Failed to load course data. Please try again.');
        this.havePreparedCourseOffering = false;
        this.cdr.detectChanges();
      }
    });
  }

  private handleCourseData(results: any): void {
    try {
      // Reset sort orders when new data is loaded
      this.regularCoursesSortOrder = null;
      this.addCoursesSortOrder = null;
      this.assessmentCoursesSortOrder = null;
      this.equivalentCoursesSortOrder = null;

      if (results.regularCourses) {
        this.resultStatus = results.regularCourses.status;
        this.studentTermCourseReg = results.regularCourses;
        this.regId = this.studentTermCourseReg?.id || null;
        this.batchCode = results.regularCourses.batchCode;
        this.applyTemporaryCreditValidationOverride();
        this.loadCreditHourConfig();
        if (!results.regularCourses.courseTermOfferings?.length) {
          this.havePreparedCourseOffering = false;
        } else {
          this.havePreparedCourseOffering = true;
          this.initializeCheckedCourses();
        }
      } else {
        this.havePreparedCourseOffering = false;
      }

      if (results.addableCourses && Array.isArray(results.addableCourses) && this.registrationVisibility.showAdd) {
        this.processAddableCourses(results.addableCourses);
      } else {
        this.resetAddableCourses();
      }

      if (results.assessmentCourses && this.registrationVisibility.showAssessment) {
        this.listOfCourseAssessment = results.assessmentCourses;
        this.setOfCheckedAssessmentCourses = new Set<string>();
        this.listOfCourseAssessment.forEach(course => {
          if (course.isRegistered && !this.isCourseDisabled(course)) {
            this.setOfCheckedAssessmentCourses.add(course.courseId);
          }
        });
        this.refreshAssessmentCheckedStatus();
      } else {
        this.listOfCourseAssessment = [];
        this.setOfCheckedAssessmentCourses = new Set<string>();
      }

      if (results.equivalentCourses && this.registrationVisibility.showEquivalent) {
        this.listOfEquivalentCourses = results.equivalentCourses;
        this.setOfCheckedEquivalentCourses = new Set<string>();
        this.listOfEquivalentCourses.forEach(course => {
          if (course.isRegistered) {
            this.setOfCheckedEquivalentCourses.add(course.courseId);
          }
        });
        this.filterEquivalentCourses();
        this.refreshEquivalentCourseCheckedStatus();
      } else {
        this.listOfEquivalentCourses = [];
        this.filteredEquivalentCourses = [];
        this.setOfCheckedEquivalentCourses = new Set<string>();
      }

      if (!this.registrationVisibility.showRegular) {
        this.setOfCheckedId = new Set<string>();
        this.refreshRegularCourseCheckedStatus();
      }

      this.cdr.detectChanges();
    } catch (error) {
      this._customNotificationService.notification('error', 'Error', 'Error processing course data. Please try again.');
      this.havePreparedCourseOffering = false;
      this.cdr.detectChanges();
    }
  }

  private processAddableCourses(courses: any[]): void {
    this.listOfAddedCourses = courses;
    this.setOfCheckedAddCourses = new Set<string>();
    this.coursePriorities.clear();

    courses.forEach(course => {
      if (course.isRegistered) {
        this.setOfCheckedAddCourses.add(course.courseId);
        if (typeof course.priority === 'number' && course.priority > 0) {
          this.coursePriorities.set(course.courseId, course.priority);
        }
      }
    });
    this.filterAddCourses(); // This will apply sorting
    this.refreshAddCourseCheckedStatus();
  }

  private resetAddableCourses(): void {
    this.listOfAddedCourses = [];
    this.filteredAddCourses = [];
    this.setOfCheckedAddCourses = new Set<string>();
    this.coursePriorities.clear();
  }

  private resetLoadingStates(): void {
    this.isLoadingRegularCourses = false;
    this.isLoadingAddCourses = false;
    this.isLoadingAssessmentCourses = false;
    this.isLoadingEquivalentCourses = false;
    this.cdr.detectChanges();
  }

  onSearchTextChange(text: string): void {
    this.searchSubject.next(text);
  }

  onSearchEquivalentTextChange(text: string): void {
    this.searchEquivalentSubject.next(text);
  }

  private initializeCheckedCourses(): void {
    this.setOfCheckedId = new Set<string>();
    this.studentTermCourseReg?.courseTermOfferings?.forEach(course => {
      if (course.isRegistered && this.countsTowardNewSemesterSelection(course)) {
        this.setOfCheckedId.add(course.courseId);
      }
    });
    this.refreshRegularCourseCheckedStatus();
  }

  private isAlreadyRegisteredSemesterCourse(course: any): boolean {
    if (!course) {
      return false;
    }
    return course.isPaid === true || course.courseStatus === 'Registered';
  }

  private isFinalizedAddCourse(course: any): boolean {
    if (!course) {
      return false;
    }
    const approvalStatus = Number(course.approvalStatus);
    return course.isPaid === true
      || course.courseStatus === 'Registered'
      || approvalStatus === 2
      || approvalStatus === 3;
  }

  private countsTowardNewSemesterSelection(course: any): boolean {
    if (!course || this.isAlreadyRegisteredSemesterCourse(course)) {
      return false;
    }
    return !this.isRegularCourseDisabled(course);
  }

  onItemChecked(id: string, checked: boolean, isAddCourse: boolean = false, isAssessment: boolean = false, isEquivalent: boolean = false): void {
    if (isAssessment) {
      this.handleAssessmentCourseSelection(id, checked);
    } else if (isAddCourse) {
      this.handleAddCourseSelection(id, checked);
    } else if (isEquivalent) {
      this.handleEquivalentCourseSelection(id, checked);
    }
    else {
      this.handleRegularCourseSelection(id, checked);
    }
    this.adjustSelectionsToStayWithinLimit();
  }

  private handleAssessmentCourseSelection(id: string, checked: boolean): void {
    const course = this.listOfCourseAssessment.find(c => c.courseId === id);
    if (!course) return;

    if (!checked) {
      if (course.isRegistered === true && course.isPaid === true && course.courseStatus === 'Registered') {
        this._customNotificationService.notification('warning', 'Warning', 'This course is already registered, paid, and confirmed. Cannot be unselected.');
        return;
      }

      // Lock if course status is "Registered"
      if (course.courseStatus === 'Registered') {
        this._customNotificationService.notification('warning', 'Warning', 'This course status is "Registered" and cannot be unselected.');
        return;
      }

      // Lock if course is paid
      if (course.isPaid === true) {
        this._customNotificationService.notification('warning', 'Warning', 'This course is already paid and cannot be unselected.');
        return;
      }

      // If course is registered by student but not paid and status is not "Registered"
      if (course.isRegistered === true && course.isPaid === false && course.courseStatus !== 'Registered') {
        // Allow unselection
        this.setOfCheckedAssessmentCourses.delete(id);
        this.refreshAssessmentCheckedStatus();
        return;
      }

      // If course is registered by student but not meeting unselection criteria
      if (course.isRegistered === true) {
        this._customNotificationService.notification('warning', 'Warning', 'This course is already registered and cannot be unselected.');
        return;
      }

      // If course is not registered (just a normal uncheck)
      this.setOfCheckedAssessmentCourses.delete(id);
      this.refreshAssessmentCheckedStatus();
      return;
    }

    // Handle checking (trying to select)
    if (checked) {
      // Check if course is disabled
      if (this.isCourseDisabled(course)) {
        this._customNotificationService.notification('warning', 'Warning',
          course.currentGrade !== 'RA'
            ? 'Only courses with RA grade can be selected for assessment'
            : 'This course is not available in the add courses list');
        return;
      }

      const courseToAdd = this.listOfCourseAssessment.find(c => c.courseId === id);
      if (this.wouldExceedCreditLimit(courseToAdd)) {
        return;
      }
      this.setOfCheckedAssessmentCourses.add(id);
      this.refreshAssessmentCheckedStatus();
      return;
    }
  }

  private handleAddCourseSelection(id: string, checked: boolean): void {
    const selectedCourse = this.filteredAddCourses.find(c => c.courseId === id)
      || this.listOfAddedCourses?.find(c => c.courseId === id);
    if (this.isFinalizedAddCourse(selectedCourse)) {
      this.setOfCheckedAddCourses.add(id);
      this.refreshAddCourseCheckedStatus();
      return;
    }

    if (checked) {
      const courseToAdd = this.filteredAddCourses.find(c => c.courseId === id);
      if (this.wouldExceedCreditLimit(courseToAdd)) {
        return;
      }
      this.setOfCheckedAddCourses.add(id);
      this.coursePriorities.set(id, 0);
    } else {
      this.setOfCheckedAddCourses.delete(id);
      this.coursePriorities.delete(id);
      if (this.setOfCheckedAddCourses.size === 0) {
        this.selectedBatchCode = null;
      }
    }
    this.refreshAddCourseCheckedStatus();
  }

  private handleRegularCourseSelection(id: string, checked: boolean): void {
    if (checked) {
      const courseToAdd = this.studentTermCourseReg?.courseTermOfferings?.find(c => c.courseId === id);
      if (this.wouldExceedCreditLimit(courseToAdd)) {
        return;
      }
      this.setOfCheckedId.add(id);
    } else {
      this.setOfCheckedId.delete(id);
    }
    this.refreshRegularCourseCheckedStatus();
  }

  private wouldExceedCreditLimit(course: any): boolean {
    // Skip credit hour validation if ignoreGradeLevelValidation is true
    if (this.studentTermCourseReg?.ignoreGradeLevelValidation === true) {
      return false;
    }

    // Skip validation if the course is already paid/registered
    if (course && course.isPaid === true) {
      return false;
    }

    // Check against total selected credit hours (both registered and new selected courses)
    if (course && (this.totalSelectedCreditHours + course.creditHours) > this.getMaxAllowedCreditHours()) {
      const cgpa = this.studentTermCourseReg?.cgpa || 0;
      let message = '';

      if (cgpa === 0) {
        message = `Adding this course would exceed your maximum allowed credit hours of ${this.getMaxAllowedCreditHours()} for new students.`;
      } else {
        message = `Adding this course would exceed your maximum allowed credit hours of ${this.getMaxAllowedCreditHours()} based on your CGPA of ${this.studentTermCourseReg?.cgpa.toFixed(2)}.`;
      }

      this._customNotificationService.notification('warning', 'Credit Hour Warning', message);
      return true;
    }
    return false;
  }

  get totalSelectedCreditHours(): number {
    const regular = this.registrationVisibility.showRegular
      ? (this.studentTermCourseReg?.courseTermOfferings
        ?.filter(course =>
          this.setOfCheckedId.has(course.courseId) ||
          this.isAlreadyRegisteredSemesterCourse(course))
        ?.reduce((total, course) => total + course.creditHours, 0) || 0)
      : 0;

    const assessment = this.registrationVisibility.showAssessment
      ? (this.listOfCourseAssessment
        ?.filter(course => this.setOfCheckedAssessmentCourses.has(course.courseId))
        ?.reduce((total, course) => total + course.creditHours, 0) || 0)
      : 0;

    const add = this.registrationVisibility.showAdd
      ? (this.filteredAddCourses
        ?.filter(course => this.setOfCheckedAddCourses.has(course.courseId))
        ?.reduce((total, course) => total + course.creditHours, 0) || 0)
      : 0;

    const equivalent = this.registrationVisibility.showEquivalent
      ? (this.listOfEquivalentCourses
        ?.filter(course => this.setOfCheckedEquivalentCourses.has(course.courseId))
        ?.reduce((total, course) => total + course.creditHours, 0) || 0)
      : 0;

    return regular + assessment + add + equivalent;
  }

  get selectedSemesterCourseCount(): number {
    if (!this.registrationVisibility.showRegular) {
      return 0;
    }
    return this.studentTermCourseReg?.courseTermOfferings
      ?.filter(course =>
        this.setOfCheckedId.has(course.courseId) &&
        this.countsTowardNewSemesterSelection(course))
      ?.length || 0;
  }

  get selectedAssessmentCourseCount(): number {
    if (!this.registrationVisibility.showAssessment) {
      return 0;
    }
    return this.listOfCourseAssessment
      ?.filter(course =>
        this.setOfCheckedAssessmentCourses.has(course.courseId) &&
        !this.isCourseDisabled(course) &&
        course.isPaid !== true &&
        course.courseStatus !== 'Registered')
      ?.length || 0;
  }

  get selectedAddCourseCount(): number {
    if (!this.registrationVisibility.showAdd) {
      return 0;
    }
    return this.filteredAddCourses
      ?.filter(course =>
        this.setOfCheckedAddCourses.has(course.courseId) &&
        !this.isFinalizedAddCourse(course))
      ?.length || 0;
  }

  get selectedEquivalentCourseCount(): number {
    if (!this.registrationVisibility.showEquivalent) {
      return 0;
    }
    return this.listOfEquivalentCourses
      ?.filter(course =>
        this.setOfCheckedEquivalentCourses.has(course.courseId) &&
        !(course.courseStatus === 'Registered' || course.isPaid === true))
      ?.length || 0;
  }

  get summarySelectedCreditHours(): number {
    const regular = this.registrationVisibility.showRegular
      ? (this.studentTermCourseReg?.courseTermOfferings
        ?.filter(course =>
          this.setOfCheckedId.has(course.courseId) &&
          this.countsTowardNewSemesterSelection(course))
        ?.reduce((total, course) => total + course.creditHours, 0) || 0)
      : 0;

    const assessment = this.registrationVisibility.showAssessment
      ? (this.listOfCourseAssessment
        ?.filter(course =>
          this.setOfCheckedAssessmentCourses.has(course.courseId) &&
          !this.isCourseDisabled(course) &&
          course.isPaid !== true &&
          course.courseStatus !== 'Registered')
        ?.reduce((total, course) => total + course.creditHours, 0) || 0)
      : 0;

    const add = this.registrationVisibility.showAdd
      ? (this.filteredAddCourses
        ?.filter(course =>
          this.setOfCheckedAddCourses.has(course.courseId) &&
          course.isPaid !== true &&
          course.courseStatus !== 'Registered')
        ?.reduce((total, course) => total + course.creditHours, 0) || 0)
      : 0;

    const equivalent = this.registrationVisibility.showEquivalent
      ? (this.listOfEquivalentCourses
        ?.filter(course =>
          this.setOfCheckedEquivalentCourses.has(course.courseId) &&
          !(course.courseStatus === 'Registered' || course.isPaid === true))
        ?.reduce((total, course) => total + course.creditHours, 0) || 0)
      : 0;

    return regular + assessment + add + equivalent;
  }

  get hasNewCourseSelection(): boolean {
    return this.selectedSemesterCourseCount > 0 ||
      this.selectedAddCourseCount > 0 ||
      this.selectedAssessmentCourseCount > 0 ||
      this.selectedEquivalentCourseCount > 0;
  }

  // Calculate only unpaid courses for payment purposes
  get totalNewSelectedCreditHours(): number {
    const regular = this.registrationVisibility.showRegular
      ? (this.studentTermCourseReg?.courseTermOfferings
        ?.filter(course => this.setOfCheckedId.has(course.courseId) && course.isPaid === false)
        ?.reduce((total, course) => total + course.creditHours, 0) || 0)
      : 0;

    const assessment = this.registrationVisibility.showAssessment
      ? (this.listOfCourseAssessment
        ?.filter(course => this.setOfCheckedAssessmentCourses.has(course.courseId) && course.isPaid === false)
        ?.reduce((total, course) => total + course.creditHours, 0) || 0)
      : 0;

    const add = this.registrationVisibility.showAdd
      ? (this.filteredAddCourses
        ?.filter(course => this.setOfCheckedAddCourses.has(course.courseId) && course.isPaid === false)
        ?.reduce((total, course) => total + course.creditHours, 0) || 0)
      : 0;

    const equivalent = this.registrationVisibility.showEquivalent
      ? (this.listOfEquivalentCourses
        ?.filter(course => this.setOfCheckedEquivalentCourses.has(course.courseId) && course.isPaid === false)
        ?.reduce((total, course) => total + course.creditHours, 0) || 0)
      : 0;

    return regular + assessment + add + equivalent;
  }

  isCourseDisabled(course: any): boolean {
    // Check if the course exists in listOfAddedCourses or studentTermCourseReg?.courseTermOfferings
    const isInAddedCourses = this.listOfAddedCourses?.some(
      addedCourse => addedCourse.courseId === course.courseId
    );
    const isInCourseOfferings = this.studentTermCourseReg?.courseTermOfferings?.some(
      offeringCourse => offeringCourse.courseId === course.courseId
    );
    const existsInLists = isInAddedCourses || isInCourseOfferings;

    // Always lock if course is paid (regardless of whether it exists in lists)
    if (course.isPaid === true) {
      return true;
    }

    // Always lock if course is registered AND paid (regardless of whether it exists in lists)
    if (course.isRegistered === true && course.isPaid === true) {
      return true;
    }

    // Already registered for assessment this term — keep locked
    if (course.courseStatus === 'Registered') {
      return true;
    }

    // Unlock RA for assessment even when the course is not in Regular/Add lists
    // (retake may be offered under another batch of the same program level).
    if (course.currentGrade === 'RA') {
      return false;
    }

    // If course exists in either list, unlock it (even if courseStatus is 'Registered' or currentGrade is not 'RA')
    // This allows courses from studentTermCourseReg?.courseTermOfferings to be selectable in assessment list
    if (existsInLists) {
      return false;
    }

    // Lock if Current Grade is not empty and not 'RA' (only if course is not in the lists)
    if (course.currentGrade && course.currentGrade !== 'RA') {
      return true;
    }

    // Lock if the course is not available in both addableCourse and regular courses
    return true;
  }

  isAssessmentCourseCheckboxDisabled(course: any): boolean {
    // Use the same logic as isCourseDisabled for assessment courses
    return this.isCourseDisabled(course);
  }

  refreshAssessmentCheckedStatus(): void {
    if (!this.listOfCourseAssessment) {
      this.checkedAssessmentCourses = false;
      this.indeterminateAssessmentCourses = false;
      return;
    }

    const totalCourses = this.listOfCourseAssessment.length;
    const checkedCount = this.setOfCheckedAssessmentCourses.size;

    this.checkedAssessmentCourses = checkedCount === totalCourses;
    this.indeterminateAssessmentCourses = checkedCount > 0 && checkedCount < totalCourses;
  }

  refreshAddCourseCheckedStatus(): void {
    if (!this.filteredAddCourses) {
      this.checkedAddCourses = false;
      this.indeterminateAddCourses = false;
      return;
    }
    const listOfEnabledData = this.filteredAddCourses;
    this.checkedAddCourses = listOfEnabledData.every(course => this.setOfCheckedAddCourses.has(course.courseId));
    this.indeterminateAddCourses = listOfEnabledData.some(course => this.setOfCheckedAddCourses.has(course.courseId)) && !this.checkedAddCourses;
  }

  getListOfCourseAssessment(applicantUserId: string, term: number, id: number): void {
    this.isLoadingAssessmentCourses = true;
    this.assessmentCoursesSortOrder = null; // Reset sort order when new data is loaded
    this._studentService
      .getListOfRetakeTermCourseOffering(applicantUserId, term, id)
      .subscribe({
        next: (res) => {
          this.listOfCourseAssessment = res;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this._customNotificationService.notification('error', 'Error', 'Failed to load assessment courses');
        },
        complete: () => {
          this.isLoadingAssessmentCourses = false;
        }
      });
  }

  checkRegistered(courseCode: any) {
    return this.studentRegisterdCourses.filter(
      (x: any) => x.courseCode == courseCode
    ).length > 0
      ? true
      : false;
  }
  getListOfAddableTermCourseOffering(applicantUserId: string, term: number, id: number) {
    this.isLoadingAddCourses = true;
    this._studentService
      .getListOfAddableTermCourseOffering(applicantUserId, term, id)
      .subscribe({
        next: (res) => {
          if (res && Array.isArray(res)) {
            this.listOfAddedCourses = res;
            this.setOfCheckedAddCourses = new Set<string>();
            this.coursePriorities.clear();
            res.forEach(course => {
              if (course.isRegistered) {
                this.setOfCheckedAddCourses.add(course.courseId);
                if (typeof course.priority === 'number' && course.priority > 0) {
                  this.coursePriorities.set(course.courseId, course.priority);
                }
              }
            });
            this.filterAddCourses(); // This will apply sorting
            this.refreshAddCourseCheckedStatus();
          } else {
            this.listOfAddedCourses = [];
            this.filteredAddCourses = [];
            this.setOfCheckedAddCourses = new Set<string>();
            this.coursePriorities.clear();
          }
        },
        error: (error) => {
          this._customNotificationService.notification('error', 'Error', 'Failed to load addable courses');
        },
        complete: () => {
          this.isLoadingAddCourses = false;
        }
      });
  }
  getListOfOfToBank() {
    let bank: StaticData = new StaticData();
    BANK_TO.forEach(pair => {
      bank = {
        Id: pair.Id,
        Description: pair.Description
      };
      this.listOfBankTo.push(bank);
    });
  }
  getBankDescription(Id: any) {
    const bank = this.listOfBankTo.find((item) => item.Id == Id);
    return bank ? bank.Description : '';

  }

  getRegisteredTermCourse(applicantUserId: string, term: number, id: number) {
    this._studentService
      .getStudentCourseOfferingId(applicantUserId, term, id)
      .subscribe((res) => {
        this.studentTermCourseReg = res;
        this.applyTemporaryCreditValidationOverride();
        this.batchCode = res.batchCode;
        this.loadCreditHourConfig();
      })
  }
  getListOfYearNumberStatus() {
    let division: StaticData = new StaticData();
    ACADEMIC_YEAR_NUMBER_STATUS.forEach((pair) => {
      division = {
        Id: pair.Id.toString(),
        Description: pair.Description,
      };
      this.listOfYearNumber.push(division);
    });
  }

  getYearNumberDescription(Id: any) {
    const program = this.listOfYearNumber.find((item) => item.Id == Id);
    return program ? program.Description : '';
  }

  getListOfAcademicTermStatus() {
    let division: StaticData = new StaticData();
    ACADEMIC_TERM_STATUS.forEach((pair) => {
      division = {
        Id: pair.Id.toString(),
        Description: pair.Description,
      };
      this.listOfTermNumber.push(division);
    });
  }

  getAcademicTermStatusDescription(Id: any): string {
    const program = this.listOfTermNumber.find((item) => item.Id == Id);
    return program ? program.Description : '';
  }

  getTotalCreditHours() {
    if (!this.studentTermCourseReg?.courseTermOfferings) {
      return 0;
    }
    return this.studentTermCourseReg.courseTermOfferings
      .filter(course => this.setOfCheckedId.has(course.courseId) && course.isPaid === false)
      .reduce((total, data) => total + data.creditHours, 0);
  }

  getTotalAmount() {
    if (!this.studentTermCourseReg?.courseTermOfferings) {
      return 0;
    }
    return this.studentTermCourseReg.courseTermOfferings
      .filter(course => this.setOfCheckedId.has(course.courseId) && course.isPaid === false)
      .reduce((total, data) => total + data.totalAmount, 0);
  }

  /** Unpaid selected amount across Regular + Assessment + Add + Equivalent. */
  getAllSelectedAmount(): number {
    const regular = this.registrationVisibility.showRegular ? this.getTotalAmount() : 0;
    const assessment = this.registrationVisibility.showAssessment ? this.getTotalAssessmentAmount() : 0;
    const add = this.registrationVisibility.showAdd ? this.getTotalAddedAmount() : 0;
    const equivalent = this.registrationVisibility.showEquivalent ? this.getTotalEquivalentAmount() : 0;
    return regular + assessment + add + equivalent;
  }

  getPenaltyAmount() {
    if (!this.studentTermCourseReg?.isLateRegistration || this.studentTermCourseReg?.isPenaltyPaid) {
      return 0;
    }
    return Number(this.studentTermCourseReg.penaltyAmount) || 0;
  }

  getAmountToPay() {
    return this.getAllSelectedAmount() + this.getPenaltyAmount();
  }

  getLateRegistrationMessage() {
    const amount = this.getPenaltyAmount().toFixed(2);
    return `The registration period has ended. A late penalty of ${amount} ETB will be added as a separate charge on payment.`;
  }

  getPaymentTotal() {
    if (!this.studentTermCourseReg?.coursePayment?.length) {
      return 0;
    }
    return this.studentTermCourseReg.coursePayment
      .reduce((total, payment) => total + (Number(payment.amount) || 0), 0);
  }

  updateCheckedSet(id: string, checked: boolean, isAddCourse: boolean = false): void {
    if (isAddCourse) {
      if (checked) {
        this.setOfCheckedId.add(id);
      } else {
        this.setOfCheckedId.delete(id);
      }
    } else {
      if (checked) {
        this.setOfCheckedId.add(id);
      } else {
        this.setOfCheckedId.delete(id);
      }
    }
  }
  refreshRegularCourseCheckedStatus(): void {
    if (!this.studentTermCourseReg?.courseTermOfferings) {
      this.checkedRegularCourses = false;
      this.indeterminateRegularCourses = false;
      return;
    }

    const totalCourses = this.studentTermCourseReg.courseTermOfferings.length;
    const checkedCount = this.setOfCheckedId.size;

    this.checkedRegularCourses = checkedCount === totalCourses;
    this.indeterminateRegularCourses = checkedCount > 0 && checkedCount < totalCourses;
  }

  getTotalAvailableRegularCourseCreditHours(): number {
    if (!this.studentTermCourseReg?.courseTermOfferings) {
      return 0;
    }

    // Calculate total credit hours including registered courses
    // This includes: Not Taken, Dropped, Registered, and Failed courses (F, RC)
    const coursesToInclude = this.studentTermCourseReg.courseTermOfferings
      .filter(course => this.shouldIncludeCourseInCreditCalculation(course));

    return coursesToInclude.reduce((total, course) => total + course.creditHours, 0);
  }

  private shouldIncludeCourseInCreditCalculation(course: any): boolean {
    // Include courses that should count toward the total credit hours
    // This is different from isRegularCourseDisabled which determines if course is selectable

    if (course.currentGrade === 'RA') {
      return false; // RA courses don't count toward credit hours
    }

    const passingGrades = ['A+', 'A', 'B', 'B+', 'C', 'D'];

    switch (course.courseStatus) {
      case 'Not Taken':
        return true;

      case 'Dropped':
        return true;

      case 'Registered':
        return true; // Registered courses count toward total credit hours

      case 'Exempted':
        return false; // Exempted courses don't count

      case 'Inactive':
        return false; // Inactive courses don't count

      case 'Has Prerequisite':
        return false; // Prerequisite courses don't count

      case 'Taken':
        if (passingGrades.includes(course.currentGrade) || course.currentGrade === '') {
          return false; // Already passed courses don't count
        } else if (course.currentGrade === 'F' || course.currentGrade === 'RC') {
          return true; // Failed courses can be retaken
        } else {
          return false;
        }

      default:
        return false;
    }
  }

  getMaxAllowedCreditHours(): number {
    if (!this.creditHourConfig?.isEnabled) {
      return this.getTotalAvailableRegularCourseCreditHours();
    }

    if (this.studentTermCourseReg?.ignoreGradeLevelValidation === true) {
      return this.getTotalAvailableRegularCourseCreditHours();
    }

    const cgpa = this.studentTermCourseReg?.cgpa || 0;

    if (cgpa === 0) {
      return this.getTotalAvailableRegularCourseCreditHours();
    }

    const limits = (this.creditHourConfig?.limits || [])
      .filter(x => x.isActive !== false)
      .slice()
      .sort((a, b) => b.minCgpa - a.minCgpa);

    const match = limits.find(x => cgpa >= x.minCgpa);
    if (match) {
      return match.maxCreditHours;
    }

    return this.getTotalAvailableRegularCourseCreditHours();
  }

  private applyTemporaryCreditValidationOverride(): void {
    if (!this.creditHourConfig?.isEnabled && this.studentTermCourseReg) {
      this.studentTermCourseReg.ignoreGradeLevelValidation = true;
    }
  }

  onAllChecked(checked: boolean, type: 'regular' | 'add' | 'assessment' | 'equivalent'): void {
    if (type === 'regular') {
      if (checked) {
        // Skip credit hour validation if ignoreGradeLevelValidation is true
        if (this.studentTermCourseReg?.ignoreGradeLevelValidation !== true) {
          // Calculate credit hours for all courses (both registered and new selected)
          const enabledCourses = this.studentTermCourseReg?.courseTermOfferings?.filter(course => !this.isRegularCourseDisabled(course)) || [];
          const totalCreditHours = enabledCourses.reduce((total, course) => total + course.creditHours, 0);
          const maxAllowed = this.getMaxAllowedCreditHours();

          if (totalCreditHours > maxAllowed) {
            const cgpa = this.studentTermCourseReg?.cgpa || 0;
            let message = '';

            if (cgpa === 0) {
              message = `Selecting all available courses would exceed your maximum allowed credit hours of ${maxAllowed} for new students.`;
            } else {
              message = `Selecting all available courses would exceed your maximum allowed credit hours of ${maxAllowed} based on your CGPA of ${this.studentTermCourseReg?.cgpa.toFixed(2)}.`;
            }

            this._customNotificationService.notification('warning', 'Credit Hour Warning', message);
            return;
          }
        }
      }

      // Only select/deselect courses that are not disabled
      this.studentTermCourseReg?.courseTermOfferings.forEach(course => {
        if (checked) {
          // Only add if the course is not disabled
          if (!this.isRegularCourseDisabled(course)) {
            this.setOfCheckedId.add(course.courseId);
          }
        } else {
          this.setOfCheckedId.delete(course.courseId);
        }
      });
      this.checkedRegularCourses = checked;
      this.indeterminateRegularCourses = false;
    } else if (type === 'add') {
      if (checked) {
        // Only select courses that are not disabled
        const enabledCourses = this.filteredAddCourses.filter(course => !this.isRegularCourseDisabled(course, 'add'));
        const coursesToSelect = enabledCourses.slice(0, this.maxAddCoursesAllowed);
        coursesToSelect.forEach(course => {
          this.setOfCheckedAddCourses.add(course.courseId);
          this.coursePriorities.set(course.courseId, 0);
        });
        this._customNotificationService.notification('warning', 'Warning',
          `Only the first ${this.maxAddCoursesAllowed} available courses were selected due to the maximum limit.`);
      } else {
        this.filteredAddCourses.forEach(course => {
          this.setOfCheckedAddCourses.delete(course.courseId);
          this.coursePriorities.delete(course.courseId);
        });
      }
      this.checkedAddCourses = checked;
      this.indeterminateAddCourses = false;
    } else if (type === 'assessment') {
      if (checked) {
        // Skip credit hour validation if ignoreGradeLevelValidation is true
        if (this.studentTermCourseReg?.ignoreGradeLevelValidation !== true) {
          // Calculate credit hours for all courses (both registered and new selected)
          const enabledCourses = this.listOfCourseAssessment?.filter(course => !this.isCourseDisabled(course)) || [];
          const totalCreditHours = enabledCourses.reduce((total, course) => total + course.creditHours, 0);
          const maxAllowed = this.getMaxAllowedCreditHours();

          if (totalCreditHours > maxAllowed) {
            const cgpa = this.studentTermCourseReg?.cgpa || 0;
            let message = '';

            if (cgpa === 0) {
              message = `Selecting all available assessment courses would exceed your maximum allowed credit hours of ${maxAllowed} for new students.`;
            } else {
              message = `Selecting all available assessment courses would exceed your maximum allowed credit hours of ${maxAllowed} based on your CGPA of ${this.studentTermCourseReg?.cgpa.toFixed(2)}.`;
            }

            this._customNotificationService.notification('warning', 'Credit Hour Warning', message);
            return;
          }
        }
      }

      // Only select/deselect courses that are not disabled
      this.listOfCourseAssessment.forEach(course => {
        if (checked) {
          // Only add if the course is not disabled
          if (!this.isCourseDisabled(course)) {
            this.setOfCheckedAssessmentCourses.add(course.courseId);
          }
        } else {
          this.setOfCheckedAssessmentCourses.delete(course.courseId);
        }
      });
      this.checkedAssessmentCourses = checked;
      this.indeterminateAssessmentCourses = false;
    } else if (type === 'equivalent') {
      if (checked) {
        // Skip credit hour validation if ignoreGradeLevelValidation is true
        if (this.studentTermCourseReg?.ignoreGradeLevelValidation !== true) {
          // Calculate credit hours for all courses (both registered and new selected)
          const enabledCourses = this.listOfEquivalentCourses?.filter(course => !this.isEquivalentCourseDisabled(course)) || [];
          const totalCreditHours = enabledCourses.reduce((total, course) => total + course.creditHours, 0);
          const maxAllowed = this.getMaxAllowedCreditHours();

          if (totalCreditHours > maxAllowed) {
            const cgpa = this.studentTermCourseReg?.cgpa || 0;
            let message = '';

            if (cgpa === 0) {
              message = `Selecting all available equivalent courses would exceed your maximum allowed credit hours of ${maxAllowed} for new students.`;
            } else {
              message = `Selecting all available equivalent courses would exceed your maximum allowed credit hours of ${maxAllowed} based on your CGPA of ${this.studentTermCourseReg?.cgpa.toFixed(2)}.`;
            }

            this._customNotificationService.notification('warning', 'Credit Hour Warning', message);
            return;
          }
        }
      }

      // Only select/deselect courses that are not disabled
      this.listOfEquivalentCourses.forEach(course => {
        if (checked) {
          // Only add if the course is not disabled
          if (!this.isEquivalentCourseDisabled(course)) {
            this.setOfCheckedEquivalentCourses.add(course.courseId);
          }
        } else {
          this.setOfCheckedEquivalentCourses.delete(course.courseId);
        }
      });
      this.checkedEquivalentCourses = checked;
      this.indeterminateEquivalentCourses = false;
    }

    this.adjustSelectionsToStayWithinLimit();
  }

  private adjustSelectionsToStayWithinLimit(): void {
    // Skip adjustment if ignoreGradeLevelValidation is true
    if (this.studentTermCourseReg?.ignoreGradeLevelValidation === true) {
      return;
    }

    const maxAllowed = this.getMaxAllowedCreditHours();
    let currentTotal = this.totalSelectedCreditHours;

    if (currentTotal <= maxAllowed) {
      return;
    }

    const regularCourses = Array.from(this.setOfCheckedId)
      .map(id => this.studentTermCourseReg?.courseTermOfferings?.find(c => c.courseId === id))
      .filter(course => course !== undefined)
      .sort((a, b) => b.creditHours - a.creditHours); // Sort by credit hours descending

    const addCourses = Array.from(this.setOfCheckedAddCourses)
      .map(id => this.filteredAddCourses.find(c => c.courseId === id))
      .filter(course => course !== undefined)
      .sort((a, b) => b.creditHours - a.creditHours);

    const assessmentCourses = Array.from(this.setOfCheckedAssessmentCourses)
      .map(id => this.listOfCourseAssessment.find(c => c.courseId === id))
      .filter(course => course !== undefined)
      .sort((a, b) => b.creditHours - a.creditHours);

    const equivalentCourses = Array.from(this.setOfCheckedEquivalentCourses)
      .map(id => this.listOfEquivalentCourses.find(c => c.courseId === id))
      .filter(course => course !== undefined)
      .sort((a, b) => b.creditHours - a.creditHours);

    // Combine all courses and sort by credit hours
    const allCourses = [...regularCourses, ...addCourses, ...assessmentCourses, ...equivalentCourses]
      .sort((a, b) => b.creditHours - a.creditHours);

    // Keep track of which courses to keep
    const coursesToKeep = new Set<string>();
    let runningTotal = 0;

    // First, keep all paid courses (they should not be adjusted)
    allCourses.forEach(course => {
      if (course.isPaid === true) {
        coursesToKeep.add(course.courseId);
        runningTotal += course.creditHours;
      }
    });

    // Then, try to keep unpaid courses with higher credit hours first
    const unpaidCourses = allCourses.filter(course => course.isPaid === false);
    for (const course of unpaidCourses) {
      if (runningTotal + course.creditHours <= maxAllowed) {
        coursesToKeep.add(course.courseId);
        runningTotal += course.creditHours;
      }
    }

    // Update selections based on courses to keep
    this.setOfCheckedId = new Set(
      Array.from(this.setOfCheckedId).filter(id => coursesToKeep.has(id))
    );
    this.setOfCheckedAddCourses = new Set(
      Array.from(this.setOfCheckedAddCourses).filter(id => coursesToKeep.has(id))
    );
    this.setOfCheckedAssessmentCourses = new Set(
      Array.from(this.setOfCheckedAssessmentCourses).filter(id => coursesToKeep.has(id))
    );
    this.setOfCheckedEquivalentCourses = new Set(
      Array.from(this.setOfCheckedEquivalentCourses).filter(id => coursesToKeep.has(id))
    );

    // Refresh all check states
    this.refreshRegularCourseCheckedStatus();
    this.refreshAddCourseCheckedStatus();
    this.refreshAssessmentCheckedStatus();
    this.refreshEquivalentCourseCheckedStatus();

    if (currentTotal > maxAllowed) {
      const cgpa = this.studentTermCourseReg?.cgpa || 0;
      let message = '';

      if (cgpa === 0) {
        message = `Some courses were automatically unselected to stay within your maximum allowed credit hours of ${maxAllowed} for new students. This includes both registered and newly selected courses.`;
      } else {
        message = `Some courses were automatically unselected to stay within your maximum allowed credit hours of ${maxAllowed} based on your CGPA of ${this.studentTermCourseReg?.cgpa.toFixed(2)}. This includes both registered and newly selected courses.`;
      }

      this._customNotificationService.notification('warning', 'Credit Hour Warning', message);
    }
  }

  private checkCreditHours(): void {
    // Only check credit hour limit if ignoreGradeLevelValidation is false
    if (!this.studentTermCourseReg?.ignoreGradeLevelValidation && this.totalSelectedCreditHours > this.getMaxAllowedCreditHours()) {
      const cgpa = this.studentTermCourseReg?.cgpa || 0;
      let message = '';

      if (cgpa === 0) {
        message = `You have selected ${this.totalSelectedCreditHours} credit hours, which exceeds the recommended limit of ${this.getMaxAllowedCreditHours()} credit hours for new students. This includes both registered and newly selected courses.`;
      } else {
        message = `You have selected ${this.totalSelectedCreditHours} credit hours, which exceeds the recommended limit of ${this.getMaxAllowedCreditHours()} credit hours. This includes both registered and newly selected courses.`;
      }

      this._customNotificationService.notification('warning', 'Credit Hour Warning', message);
    }
  }

  getCoursePriority(courseId: string): number {
    return this.coursePriorities.get(courseId) ?? 0;
  }

  updateCoursePriority(courseId: string, priority: number): void {
    // Priority validation commented out - always set to 0
    // if (priority < 0 || priority > 3) {
    //   this._customNotificationService.notification('error', 'Error', 'Priority must be between 1 and 3');
    //   return;
    // }

    // // Check if this priority is already assigned to another course
    // const existingCourseWithPriority = Array.from(this.coursePriorities.entries())
    //   .find(([id, p]) => id !== courseId && p === priority);

    // if (existingCourseWithPriority) {
    //   this._customNotificationService.notification('error', 'Error', `Priority ${priority} is already assigned to another course`);
    //   return;
    // }

    // Always set priority to 0
    this.coursePriorities.set(courseId, 0);
  }

  getTotalAddedCreditHours(): number {
    if (!this.filteredAddCourses) {
      return 0;
    }
    return this.filteredAddCourses
      .filter(course => this.setOfCheckedAddCourses.has(course.courseId) && course.isPaid === false)
      .reduce((total, course) => total + course.creditHours, 0);
  }
  getTotalAddedAmount(): number {
    if (!this.filteredAddCourses) {
      return 0;
    }
    return this.filteredAddCourses
      .filter(course => this.setOfCheckedAddCourses.has(course.courseId) && course.isPaid === false)
      .reduce((total, course) => total + course.totalAmount, 0);
  }
  onCurrentPageDataChange(listOfCurrentPageData: readonly any[]): void {
    this.listOfCurrentPageData = listOfCurrentPageData;
    this.refreshRegularCourseCheckedStatus();
  }
  sendRequest(): void {
    if (this.isSubmitting) {
      return;
    }
    this.isSubmitting = true;

    // Validate required data before proceeding
    if (!this.studentTermCourseReg) {
      this._customNotificationService.notification('error', 'Error', 'Student course registration data is not available. Please refresh the page and try again.');
      this.isSubmitting = false;
      return;
    }

    if (!this.registrationVisibility.showRegular &&
      !this.registrationVisibility.showAdd &&
      !this.registrationVisibility.showAssessment &&
      !this.registrationVisibility.showEquivalent) {
      this._customNotificationService.notification('warning', 'Warning', 'No registration sections are open for this academic term.');
      this.isSubmitting = false;
      return;
    }

    if (this.registrationVisibility.showRegular && !this.studentTermCourseReg.courseTermOfferings) {
      this._customNotificationService.notification('error', 'Error', 'No course offerings available for registration.');
      this.isSubmitting = false;
      return;
    }

    // Check if any newly selectable courses are selected
    const hasRegularCourses = this.registrationVisibility.showRegular && this.selectedSemesterCourseCount > 0;
    const hasAddCourses = this.registrationVisibility.showAdd && this.selectedAddCourseCount > 0;
    const hasAssessmentCourses = this.registrationVisibility.showAssessment && this.selectedAssessmentCourseCount > 0;
    const hasEquivalentCourses = this.registrationVisibility.showEquivalent && this.selectedEquivalentCourseCount > 0;

    if (!hasRegularCourses && !hasAddCourses && !hasAssessmentCourses && !hasEquivalentCourses) {
      this._customNotificationService.notification('warning', 'Warning', 'Please select at least one course for registration.');
      this.isSubmitting = false;
      return;
    }

    const semester = "Semester";

    try {
      const assessmentCourses: SelectedCourses[] = this.registrationVisibility.showAssessment
        ? Array.from(this.setOfCheckedAssessmentCourses)
          .map(courseId => {
            const course = this.listOfCourseAssessment?.find(c => c.courseId === courseId);
            if (!course) {
              throw new Error(`Assessment course with ID ${courseId} not found`);
            }
            return {
              courseId: courseId,
              registrationStatus: RegistrationStatus.Assessment,
              priority: 0,
              totalAmount: course.totalAmount || 0,
              batchCode: course.batchCode || null
            };
          })
        : [];

      const regularCourses: SelectedCourses[] = this.registrationVisibility.showRegular
        ? Array.from(this.setOfCheckedId)
          .map(courseId => {
            const course = this.studentTermCourseReg.courseTermOfferings.find(c => c.courseId === courseId);
            if (!course) {
              throw new Error(`Regular course with ID ${courseId} not found`);
            }
            return course;
          })
          .filter(course => course && course.courseStatus !== 'Registered' && course.courseStatus !== 'Taken')
          .map(course => ({
            courseId: course.courseId,
            registrationStatus: RegistrationStatus.Regular,
            priority: 0,
            totalAmount: course.totalAmount || 0,
            batchCode: course.batchCode || null
          }))
        : [];

      const addCourses: SelectedCourses[] = this.registrationVisibility.showAdd
        ? Array.from(this.setOfCheckedAddCourses)
          .map(courseId => {
            const course = this.listOfAddedCourses?.find(c => c.courseId === courseId);
            if (!course) {
              throw new Error(`Add course with ID ${courseId} not found`);
            }
            return course;
          })
          .filter(course => course && !this.isFinalizedAddCourse(course))
          .map(course => ({
            courseId: course.courseId,
            registrationStatus: RegistrationStatus.Add,
            priority: this.coursePriorities.get(course.courseId) ?? 0,
            totalAmount: course.totalAmount || 0,
            batchCode: course.batchCode || null
          }))
        : [];

      const equivalentCourses: SelectedCourses[] = this.registrationVisibility.showEquivalent
        ? Array.from(this.setOfCheckedEquivalentCourses)
          .filter(courseId => {
            const course = this.listOfEquivalentCourses.find(c => c.courseId === courseId);
            return course && course.courseStatus !== 'Registered';
          })
          .map(courseId => {
            const course = this.listOfEquivalentCourses.find(c => c.courseId === courseId);
            return {
              courseId: course?.equivalentCourseId || courseId,
              registrationStatus: RegistrationStatus.Equivalent,
              priority: 0,
              totalAmount: course ? course.totalAmount : 0,
              batchCode: course?.batchCode || null
            };
          })
        : [];

      // Validate add course priorities - COMMENTED OUT
      // if (addCourses.length > 0) {
      //   const hasUnassignedPriority = addCourses.some(course => course.priority === 0);
      //   if (hasUnassignedPriority) {
      //     this._customNotificationService.notification('error', 'Error', 'All selected add course requests must have a priority assigned');
      //     this.isSubmitting = false;
      //     return;
      //   }
      // }

      // Create student course offering object
      const studentCourseOffering = new StudentCourseOffering();
      studentCourseOffering.academicTermCode = this.studentTermCourseReg.academicProgramId;
      studentCourseOffering.academicTermId = this.nextAcademicTerm?.id;
      studentCourseOffering.studentId = this.studentTermCourseReg.studId;
      studentCourseOffering.termCourseOfferingId = this.studentTermCourseReg.termCourseOfferingId;
      studentCourseOffering.selectedCourses = [
        ...regularCourses,
        ...addCourses,
        ...assessmentCourses,
        ...equivalentCourses
      ];

      // Validate the offering object
      if (!studentCourseOffering.academicTermId || !studentCourseOffering.studentId || !studentCourseOffering.termCourseOfferingId) {
        this._customNotificationService.notification('error', 'Error', 'Missing required registration information. Please refresh and try again.');
        this.isSubmitting = false;
        return;
      }

      // Check if there are courses that require payment (regular courses, assessment courses, or equivalent courses)
      const hasPaymentRequiredCourses = regularCourses.length > 0 || assessmentCourses.length > 0 || equivalentCourses.length > 0;

      // Handle update or create with proper subscription management
      if (this.regId != null) {
        this._studentService.updateStudentCourseRegistration(this.regId, studentCourseOffering)
          .pipe(
            takeUntil(this.destroy$),
            finalize(() => {
              this.isSubmitting = false;
            })
          )
          .subscribe({
            next: (res) => {
              if (res && res.data) {
                this.registrationId = res.data.id;
                this.handleNotification('success', 'Success', res.studentId);
                this.isSubmitting = false;
                if (hasPaymentRequiredCourses) {
                  this._route.navigateByUrl(`banks/registration/payment-options?registrationid=${this.regId}&code=${this.batchCode}&type=${semester}`);
                  // this._route.navigateByUrl(`banks/registration/payment-options?registrationid=${this.regId}&code=${this.batchCode}&type=${semester}`);
                } else {
                  this._route.navigateByUrl('students/manage-student-course-registration');
                }
              } else {
                this._customNotificationService.notification('error', 'Error', 'Invalid response from server. Please try again.');
              }
            },
            error: (error) => {
              console.error('Update registration error:', error);
              this._customNotificationService.notification('error', 'Error', 'Failed to update course registration. Please try again.');
            }
          });
      } else {
        this._studentService.create(studentCourseOffering)
          .pipe(
            takeUntil(this.destroy$),
            finalize(() => {
              this.isSubmitting = false;
            })
          )
          .subscribe({
            next: (res) => {
              if (res && res.data) {
                this.registrationId = res.data.id;
                this.handleNotification('success', 'Success', res.studentId);
                this.isSubmitting = false;
                if (hasPaymentRequiredCourses) {
                  this._route.navigateByUrl(`banks/registration/payment-options?registrationid=${this.registrationId}&code=${this.batchCode}&type=${semester}`);
                  // this._route.navigateByUrl(`banks/registration/payment-options?registrationid=${this.regId}&code=${this.batchCode}&type=${semester}`);
                } else {
                  this._route.navigateByUrl('students/manage-student-course-registration');
                }
              } else {
                this._customNotificationService.notification('error', 'Error', 'Invalid response from server. Please try again.');
              }
            },
            error: (error) => {
              console.error('Create registration error:', error);
              this._customNotificationService.notification('error', 'Error', 'Failed to create course registration. Please try again.');
            }
          });
      }
    } catch (error) {
      console.error('SendRequest error:', error);
      this._customNotificationService.notification('error', 'Error', 'An unexpected error occurred while processing your request. Please try again.');
      this.isSubmitting = false;
    }
  }
  goToPayment(id: number, registrationId: string, batchCode: string): void {
    this._route.navigate(['banks/add-student-payment', id, registrationId, batchCode]);
  }
  private handleNotification(type: string, message: string, studentId: string) {
    this._customNotificationService.notification(type, message, studentId);
    // Note: Redirect logic is now handled in the success handlers of sendRequest()
  }

  private clearSelectionAndRefresh() {
    this.setOfCheckedId.clear();
    this.refreshRegularCourseCheckedStatus();
    this.loading = false;
  }

  getNextAcademicTerm() {
    this.batchTermService.getNextAcademicTerm().subscribe({
      next: (res: any) => {
        this.nextAcademicTerm = res;
        this.initializeAcademicTerm();
        this.loadCreditHourConfig();
        if (this.applicantUserId && this.academicTermId) {
          this.resetAllStates();
          this.loadCourseData();
        }
      },
      error: () => {
        this._customNotificationService.notification('error', 'Error', 'Failed to load academic term information');
      }
    });
  }


  calculateSeason() {
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    if (month >= 3 && month <= 5) {
      this.season = 2;
    } else if (month >= 6 && month <= 8) {
      this.season = 3;
    } else if (month >= 9 && month <= 11) {
      this.season = 4;
    } else {
      this.season = 1;
    }
  }
  generatePrintContent(): string {
    return this.printContentService.generateRegistrationSlip({
      studentTermCourseReg: this.studentTermCourseReg,
      seasonTitles: this.seasonTitles,
      getYearNumberDescription: this.getYearNumberDescription.bind(this),
      getTotalCreditHours: this.getTotalCreditHours.bind(this),
      getTotalAmount: this.getTotalAmount.bind(this)
    });
  }

  printSlip(): void {
    const printContent = this.generatePrintContent();
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    } else {
      console.error("Failed to open print window.");
    }
  }


  getSeasonWithYear(): string {
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    let seasonName = '';

    if (month >= 3 && month <= 5) {
      seasonName = 'Spring';
    } else if (month >= 6 && month <= 8) {
      seasonName = 'Summer';
    } else if (month >= 9 && month <= 11) {
      seasonName = 'Autumn';
    } else {
      seasonName = 'Winter';
    }

    return `${seasonName} ${year} - Term Registration`;
  }

  filterAddCourses(): void {
    let filtered: CourseBreakDownOffering[];
    if (!this.searchAddCourseText) {
      filtered = [...this.listOfAddedCourses];
    } else {
      const searchText = this.searchAddCourseText.toLowerCase();
      filtered = this.listOfAddedCourses.filter(course =>
        course.courseCode.toLowerCase().includes(searchText) ||
        course.courseTitle.toLowerCase().includes(searchText)
      );
    }
    this.filteredAddCourses = this.applySorting(filtered, 'add');
  }

  filterEquivalentCourses(): void {
    let filtered: CourseBreakDownOffering[];
    if (!this.searchEquivalentCourseText) {
      filtered = [...this.listOfEquivalentCourses];
    } else {
      const searchText = this.searchEquivalentCourseText.toLowerCase();
      filtered = this.listOfEquivalentCourses.filter(course =>
        course.courseCode.toLowerCase().includes(searchText) ||
        course.courseTitle.toLowerCase().includes(searchText) ||
        course.equivalentCourseCode.toLowerCase().includes(searchText) ||
        course.equivalentCourseTitle.toLowerCase().includes(searchText)
      );
    }
    this.filteredEquivalentCourses = this.applySorting(filtered, 'equivalent');
  }

  // Sorting methods
  sortByCourseTitle(tableType: 'regular' | 'add' | 'assessment' | 'equivalent'): void {
    switch (tableType) {
      case 'regular':
        if (this.regularCoursesSortOrder === null || this.regularCoursesSortOrder === 'desc') {
          this.regularCoursesSortOrder = 'asc';
        } else {
          this.regularCoursesSortOrder = 'desc';
        }
        if (this.studentTermCourseReg?.courseTermOfferings) {
          this.studentTermCourseReg.courseTermOfferings = this.applySorting(
            [...this.studentTermCourseReg.courseTermOfferings],
            'regular'
          );
        }
        break;
      case 'add':
        if (this.addCoursesSortOrder === null || this.addCoursesSortOrder === 'desc') {
          this.addCoursesSortOrder = 'asc';
        } else {
          this.addCoursesSortOrder = 'desc';
        }
        this.filteredAddCourses = this.applySorting([...this.filteredAddCourses], 'add');
        break;
      case 'assessment':
        if (this.assessmentCoursesSortOrder === null || this.assessmentCoursesSortOrder === 'desc') {
          this.assessmentCoursesSortOrder = 'asc';
        } else {
          this.assessmentCoursesSortOrder = 'desc';
        }
        this.listOfCourseAssessment = this.applySorting([...this.listOfCourseAssessment], 'assessment');
        break;
      case 'equivalent':
        if (this.equivalentCoursesSortOrder === null || this.equivalentCoursesSortOrder === 'desc') {
          this.equivalentCoursesSortOrder = 'asc';
        } else {
          this.equivalentCoursesSortOrder = 'desc';
        }
        this.filteredEquivalentCourses = this.applySorting([...this.filteredEquivalentCourses], 'equivalent');
        break;
    }
    this.cdr.detectChanges();
  }

  getSortIcon(tableType: 'regular' | 'add' | 'assessment' | 'equivalent'): string {
    let sortOrder: 'asc' | 'desc' | null;
    switch (tableType) {
      case 'regular':
        sortOrder = this.regularCoursesSortOrder;
        break;
      case 'add':
        sortOrder = this.addCoursesSortOrder;
        break;
      case 'assessment':
        sortOrder = this.assessmentCoursesSortOrder;
        break;
      case 'equivalent':
        sortOrder = this.equivalentCoursesSortOrder;
        break;
    }
    if (sortOrder === null) return 'sort';
    return sortOrder === 'asc' ? 'sort-ascending' : 'sort-descending';
  }

  private applySorting(data: any[], tableType: 'regular' | 'add' | 'assessment' | 'equivalent'): any[] {
    let sortOrder: 'asc' | 'desc' | null;
    switch (tableType) {
      case 'regular':
        sortOrder = this.regularCoursesSortOrder;
        break;
      case 'add':
        sortOrder = this.addCoursesSortOrder;
        break;
      case 'assessment':
        sortOrder = this.assessmentCoursesSortOrder;
        break;
      case 'equivalent':
        sortOrder = this.equivalentCoursesSortOrder;
        break;
    }

    if (sortOrder === null) {
      return data;
    }

    const sorted = [...data].sort((a, b) => {
      const titleA = (a.courseTitle || '').toLowerCase();
      const titleB = (b.courseTitle || '').toLowerCase();

      if (sortOrder === 'asc') {
        return titleA.localeCompare(titleB);
      } else {
        return titleB.localeCompare(titleA);
      }
    });

    return sorted;
  }

  get tableScrollHeight(): string {
    const width = window.innerWidth;
    if (width < 768) {
      return '250px';
    } else if (width < 992) {
      return '350px';
    } else {
      return 'calc(100vh - 250px)';
    }
  }

  isRegularCourseDisabled(course: any, context?: 'regular' | 'add'): boolean {
    if (this.isAlreadyRegisteredSemesterCourse(course)) {
      return true;
    }

    if (context === 'add') {
      if (this.isFinalizedAddCourse(course)) {
        return true;
      }
      switch (course.courseStatus) {
        case 'Not Taken':
        case 'Dropped':
        case 'Taken':
          return false;
        case 'Registered':
        case 'Exempted':
        case 'Inactive':
        case 'Has Prerequisite':
          return true;
        default:
          return false;
      }
    }

    // Regular context - apply normal grade-based locking
    if (course.currentGrade === 'RA') {
      return true;
    }

    const passingGrades = ['A+', 'A', 'B', 'B+', 'C', 'D'];

    switch (course.courseStatus) {
      case 'Not Taken':
        return false;

      case 'Dropped':
        return false;

      case 'Registered':
        return true; // Registered courses are locked (already registered)

      case 'Exempted':
        return true;

      case 'Inactive':
        return true;

      case 'Has Prerequisite':
        return true;

      case 'Taken':
        if (passingGrades.includes(course.currentGrade) || course.currentGrade === '') {
          return true;
        } else if (course.currentGrade === 'F' || course.currentGrade === 'RC') {
          return false;
        } else {
          return true;
        }

      default:
        return true;
    }
  }

  isEquivalentCourseDisabled(course: any): boolean {
    // Lock if course is already registered or paid
    if (course.courseStatus === 'Registered' || course.isPaid === true) {
      return true;
    }

    // For equivalent courses, RA and RC grades should be unlocked (selectable)
    // This is different from regular courses where RA grades are locked

    // First check: RA and RC grades should always be unlocked for equivalent courses
    if (course.currentGrade === 'RA' || course.currentGrade === 'RC') {
      return false; // Unlocked
    }

    const passingGrades = ['A+', 'A', 'B', 'B+', 'C', 'D'];

    switch (course.courseStatus) {
      case 'Not Taken':
        return false;

      case 'Dropped':
        return false;

      case 'Registered':
        return true; // Registered courses are locked (already registered)

      case 'Exempted':
        return true;

      case 'Inactive':
        return true;

      case 'Has Prerequisite':
        return true;

      case 'Taken':
      case 'Taken (Equivalent)':
        if (passingGrades.includes(course.currentGrade) || course.currentGrade === '') {
          return true;
        } else if (course.currentGrade === 'F') {
          return false;
        } else {
          return true;
        }

      default:
        return true;
    }
  }

  getCourseLockTooltipMessage(course: any, context: 'regular' | 'add' | 'equivalent' = 'regular'): string {
    if (context === 'add' && this.isFinalizedAddCourse(course)) {
      const approvalStatus = Number(course.approvalStatus);
      if (approvalStatus === 2) {
        return 'This add course request was rejected and cannot be resubmitted';
      }
      return 'This add course request is already approved and cannot be resubmitted';
    }

    if (course.courseStatus === 'Registered') {
      return 'Course is already registered and cannot be modified';
    }

    // Handle RA and RC grades
    if (course.currentGrade === 'RA' || course.currentGrade === 'RC') {
      if (context === 'equivalent') {
        return 'Course is available for equivalent selection';
      }
      return context === 'add'
        ? 'Course is not available for add request'
        : 'Course is not available for regular registration';
    }

    // Handle different course statuses
    switch (course.courseStatus) {
      case 'Exempted':
        return 'Course is exempted - you have already fulfilled this requirement';

      case 'Inactive':
        return 'Course is currently inactive and not available for registration';

      case 'Has Prerequisite':
        return 'Course has prerequisite requirements that must be completed first';

      case 'Taken':
        const passingGrades = ['A+', 'A', 'B', 'B+', 'C', 'D'];
        if (passingGrades.includes(course.currentGrade) || course.currentGrade === '') {
          return 'Course has already been taken and passed';
        } else if (course.currentGrade === 'F' || course.currentGrade === 'RC') {
          return 'Course is available for retake (previously failed)';
        } else {
          return 'Course has already been taken';
        }

      case 'Dropped':
        return 'Course was previously dropped and is now available for selection';

      case 'Registered':
        return 'Course is already registered and cannot be modified';

      case 'Not Taken':
        return 'Course is available for selection';

      default:
        return 'Course is not available for selection';
    }
  }

  getCourseAssessmentLockTooltipMessage(course: any): string {
    if (course.isPaid === true || (course.isRegistered === true && course.isPaid === true)) {
      return 'Course assessment is locked because it is already paid';
    }

    if (course.courseStatus === 'Registered') {
      return 'Course assessment is locked because it is already registered';
    }

    // RA courses are selectable for assessment (no Regular/Add list requirement)
    if (course.currentGrade === 'RA') {
      return 'Course is available for assessment';
    }

    // Lock if Current Grade is not empty and not 'RA'
    if (course.currentGrade && course.currentGrade !== 'RA') {
      return 'Course assessment is locked because the current grade has changed from RA';
    }

    // Lock if the course is not available in both addableCourse and regular courses
    const isInAddedCourses = this.listOfAddedCourses?.some(
      addedCourse => addedCourse.courseId === course.courseId
    );

    const isInCourseOfferings = this.studentTermCourseReg?.courseTermOfferings?.some(
      offeringCourse => offeringCourse.courseId === course.courseId
    );

    if (!(isInAddedCourses || isInCourseOfferings)) {
      return 'Course is not available in the regular course list or add request list';
    }

    return 'Course is available for assessment';
  }

  getTotalAssessmentCreditHours(): number {
    if (!this.listOfCourseAssessment) {
      return 0;
    }
    return this.listOfCourseAssessment
      .filter(course => this.setOfCheckedAssessmentCourses.has(course.courseId) && course.isPaid === false)
      .reduce((total, course) => total + course.creditHours, 0);
  }
  getTotalAssessmentAmount(): number {
    if (!this.listOfCourseAssessment) {
      return 0;
    }
    return this.listOfCourseAssessment
      .filter(course => this.setOfCheckedAssessmentCourses.has(course.courseId) && course.isPaid === false)
      .reduce((total, course) => total + course.totalAmount, 0);
  }

  getTotalEquivalentCreditHours(): number {
    if (!this.filteredEquivalentCourses) {
      return 0;
    }
    return this.filteredEquivalentCourses
      .filter(course => this.setOfCheckedEquivalentCourses.has(course.courseId) && course.isPaid === false)
      .reduce((total, course) => total + course.creditHours, 0);
  }

  getTotalEquivalentAmount(): number {
    if (!this.filteredEquivalentCourses) {
      return 0;
    }
    return this.filteredEquivalentCourses
      .filter(course => this.setOfCheckedEquivalentCourses.has(course.courseId) && course.isPaid === false)
      .reduce((total, course) => total + course.totalAmount, 0);
  }
  private handleEquivalentCourseSelection(id: string, checked: boolean): void {
    if (checked) {
      const courseToAdd = this.listOfEquivalentCourses.find(c => c.courseId === id);
      if (this.wouldExceedCreditLimit(courseToAdd)) {
        return;
      }
      this.setOfCheckedEquivalentCourses.add(id);
    } else {
      this.setOfCheckedEquivalentCourses.delete(id);
    }
    this.refreshEquivalentCourseCheckedStatus();
  }
  refreshEquivalentCourseCheckedStatus(): void {
    if (!this.filteredEquivalentCourses) {
      this.checkedEquivalentCourses = false;
      this.indeterminateEquivalentCourses = false;
      return;
    }
    const listOfEnabledData = this.filteredEquivalentCourses;
    this.checkedEquivalentCourses = listOfEnabledData.every(course => this.setOfCheckedEquivalentCourses.has(course.courseId));
    this.indeterminateEquivalentCourses = listOfEnabledData.some(course => this.setOfCheckedEquivalentCourses.has(course.courseId)) && !this.checkedEquivalentCourses;
  }
  getListOfEquivalentCourses(applicantUserId: string, term: number, id: number): void {
    this.isLoadingEquivalentCourses = true;
    this.equivalentCoursesSortOrder = null; // Reset sort order when new data is loaded
    this._studentService
      .getAddableCoursesWithEquivalentsAsync(applicantUserId, term, id)
      .subscribe({
        next: (res) => {
          this.listOfEquivalentCourses = res;
          // Initialize checked state for equivalent courses
          this.setOfCheckedEquivalentCourses = new Set<string>();
          this.listOfEquivalentCourses.forEach(course => {
            if (course.isRegistered) {
              this.setOfCheckedEquivalentCourses.add(course.courseId);
            }
          });
          this.filterEquivalentCourses(); // This will apply sorting
          this.refreshEquivalentCourseCheckedStatus();
        },
        error: (error) => {
          this._customNotificationService.notification('error', 'Error', 'Failed to load equivalent courses');
        },
        complete: () => {
          this.isLoadingEquivalentCourses = false;
        }
      });
  }
  downloadPDF(): void {
    if (this.isGeneratingPDF) {
      return;
    }

    this.isGeneratingPDF = true;
    const printContent = this.generatePrintContent();
    const printWindow = window.open("", "_blank");

    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();

      // Wait for images to load
      setTimeout(() => {
        const element = printWindow.document.body;
        const opt = {
          margin: [0.5, 0.5, 0.5, 0.5],
          filename: `registration-slip-${this.studentTermCourseReg?.studentId || 'student'}-${new Date().toISOString().split('T')[0]}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            letterRendering: true,
            allowTaint: true
          },
          jsPDF: {
            unit: 'in',
            format: 'letter',
            orientation: 'portrait',
            compress: true,
            hotfixes: ['px_scaling']
          }
        };

        // Add inline styles to ensure they are applied
        const styleElement = printWindow.document.createElement('style');
        styleElement.textContent = `
          body {
            font-family: Arial, sans-serif !important;
            margin: 0 !important;
            padding: 20px !important;
            background-color: #fff !important;
            color: #333 !important;
          }
          .page-wrapper {
            max-width: 800px !important;
            margin: 0 auto !important;
            background: #fff !important;
            padding: 20px !important;
            position: relative !important;
          }
          .header {
            text-align: center !important;
            border-bottom: 3px solid #093e96 !important;
            padding-bottom: 15px !important;
            margin-bottom: 20px !important;
          }
          .header h2 {
            color: #093e96 !important;
            font-size: 24px !important;
            font-weight: 600 !important;
          }
          .sub-header {
            text-align: center !important;
            font-size: 18px !important;
            font-weight: bold !important;
            color: #093e96 !important;
            margin-bottom: 25px !important;
          }
          .student-info {
            display: flex !important;
            justify-content: space-between !important;
            background: #f8f9fa !important;
            padding: 15px !important;
            border-radius: 8px !important;
            margin-bottom: 20px !important;
            border: 1px solid #e8e8e8 !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin-top: 20px !important;
            font-size: 14px !important;
          }
          th {
            background-color: #093e96 !important;
            color: white !important;
            padding: 12px 8px !important;
            text-align: left !important;
            font-weight: 600 !important;
            border: 1px solid #ddd !important;
          }
          td {
            padding: 8px !important;
            border: 1px solid #ddd !important;
          }
          tfoot td {
            background-color: #f8f9fa !important;
            font-weight: bold !important;
            padding: 12px 8px !important;
          }
          .signature-section {
            display: flex !important;
            justify-content: space-between !important;
            margin-top: 40px !important;
            padding-top: 20px !important;
            border-top: 2px solid #093e96 !important;
          }
          .signature-box {
            width: 45% !important;
            text-align: center !important;
          }
          .signature-line {
            border-top: 1px solid #333 !important;
            margin-top: 50px !important;
            width: 80% !important;
            margin-left: auto !important;
            margin-right: auto !important;
          }
          .watermark {
            position: absolute !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) rotate(-45deg) !important;
            font-size: 48px !important;
            font-weight: bold !important;
            color: rgba(9, 62, 150, 0.1) !important;
            text-transform: uppercase !important;
            z-index: 1 !important;
            pointer-events: none !important;
            user-select: none !important;
            white-space: nowrap !important;
          }
          .logo-watermark {
            position: absolute !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) rotate(-45deg) !important;
            width: 400px !important;
            height: 400px !important;
            background-image: url('${window.location.origin}/assets/images/logo.png') !important;
            background-size: contain !important;
            background-repeat: no-repeat !important;
            background-position: center !important;
            opacity: 0.05 !important;
            z-index: 1 !important;
            pointer-events: none !important;
            user-select: none !important;
          }
          .footer {
            margin-top: 30px !important;
            text-align: center !important;
            font-size: 12px !important;
            color: #666 !important;
            border-top: 1px solid #ddd !important;
            padding-top: 15px !important;
          }
        `;
        printWindow.document.head.appendChild(styleElement);

        html2pdf().set(opt).from(element).save()
          .then(() => {
            printWindow.close();
            this._customNotificationService.notification('success', 'Success', 'PDF downloaded successfully');
          })
          .catch((error) => {
            console.error('PDF generation error:', error);
            this._customNotificationService.notification('error', 'Error', 'Failed to generate PDF');
          })
          .finally(() => {
            this.isGeneratingPDF = false;
          });
      }, 1000);
    } else {
      this._customNotificationService.notification('error', 'Error', 'Failed to open print window');
      this.isGeneratingPDF = false;
    }
  }

  isAllCoursesDisabled(): boolean {
    if (!this.listOfCourseAssessment) {
      return false;
    }
    return this.listOfCourseAssessment.every(course => this.isCourseDisabled(course));
  }

  // Returns true if the course (with F or RC) is selected in the other table
  isCourseSelectedInOtherTable(course: any, currentTable: 'available' | 'add'): boolean {
    // Only apply this rule for F or RC grades
    if (!(course.currentGrade === 'F' || course.currentGrade === 'RC')) {
      return false;
    }
    if (currentTable === 'available') {
      return this.setOfCheckedAddCourses.has(course.courseId);
    } else {
      return this.setOfCheckedId.has(course.courseId);
    }
  }

  onSubmitClicked(): void {
    if (this.isSubmitting) {
      return;
    }

    // Only check credit hour limit if ignoreGradeLevelValidation is false
    if (!this.studentTermCourseReg?.ignoreGradeLevelValidation && this.totalSelectedCreditHours > this.getMaxAllowedCreditHours()) {
      const cgpa = this.studentTermCourseReg?.cgpa || 0;
      let contentMessage = '';
      let warningMessage = '';

      if (cgpa === 0) {
        contentMessage = `You have selected ${this.totalSelectedCreditHours} credit hours, which exceeds the recommended limit of ${this.getMaxAllowedCreditHours()} credit hours for new students. This includes both registered and newly selected courses. Would you like to proceed with the registration?`;
        warningMessage = `You are proceeding with more than ${this.getMaxAllowedCreditHours()} credit hours. This may affect your academic performance.`;
      } else {
        contentMessage = `You have selected ${this.totalSelectedCreditHours} credit hours, which exceeds the recommended limit of ${this.getMaxAllowedCreditHours()} credit hours. This includes both registered and newly selected courses. Would you like to proceed with the registration?`;
        warningMessage = `You are proceeding with more than ${this.getMaxAllowedCreditHours()} credit hours. This may affect your academic performance.`;
      }

      this.modal.confirm({
        nzTitle: 'Credit Hour Limit Exceeded',
        nzContent: contentMessage,
        nzOkText: 'Yes, Proceed',
        nzOkType: 'primary',
        nzOkDanger: true,
        nzCancelText: 'No, Cancel',
        nzOnOk: () => {
          if (this.isSubmitting) {
            return;
          }
          this._customNotificationService.notification('warning', 'Credit Hour Warning', warningMessage);
          this.sendRequest();
        }
      });
      return;
    }
    this.sendRequest();
  }

  // Add refresh method
  refreshData(): void {
    this.resetAllStates();
    this.loadCourseData();
  }

  // Method to refresh the page
  refreshPage(): void {
    this.refreshData();
  }

  // Method to contact academic office
  contactAcademicOffice(): void {
    this.modal.info({
      nzTitle: 'Contact Academic Office',
      nzContent: `
        <div style="text-align: center; padding: 20px;">
          <p><strong>For assistance with course registration, please contact:</strong></p>
          <br>
          <p><strong>Academic Office</strong></p>
          <p>📞 Phone: +251-11-123-4567</p>
          <p>📧 Email: academic@hilcoe.edu.et</p>
          <p>🏢 Office: Main Campus, Building A, Room 101</p>
          <p>🕒 Hours: Monday - Friday, 8:00 AM - 5:00 PM</p>
          <br>
          <p><em>Please have your Student ID ready when contacting us.</em></p>
        </div>
      `,
      nzOkText: 'Got it',
      nzWidth: 500
    });
  }

  // Method to view registration history
  viewRegistrationHistory(): void {
    this._customNotificationService.notification('info', 'Registration History',
      'This feature will be available soon. You can check your registration history in the student portal.');
  }

  // Method to contact IT support
  contactITSupport(): void {
    this.modal.info({
      nzTitle: 'Contact IT Support',
      nzContent: `
        <div style="text-align: center; padding: 20px;">
          <p><strong>For technical support with the registration system, please contact:</strong></p>
          <br>
          <p><strong>IT Support Team</strong></p>
          <p>📞 Phone: +251-11-123-4568</p>
          <p>📧 Email: itsupport@hilcoe.edu.et</p>
          <p>🏢 Office: IT Building, Room 205</p>
          <p>🕒 Hours: Monday - Friday, 8:00 AM - 6:00 PM</p>
          <p>🕒 Weekend: Saturday, 9:00 AM - 1:00 PM</p>
          <br>
          <p><em>Please provide your Student ID and describe the technical issue you're experiencing.</em></p>
        </div>
      `,
      nzOkText: 'Got it',
      nzWidth: 500
    });
  }

  // Method to complete profile
  completeProfile(): void {
    this._customNotificationService.notification('info', 'Complete Profile',
      'Redirecting to profile completion page. Please ensure all required information is filled out.');
    // You can add navigation to profile page here
    // this._route.navigate(['/student/profile']);
  }

  // Method to contact registrar
  contactRegistrar(): void {
    this.modal.info({
      nzTitle: 'Contact Registrar\'s Office',
      nzContent: `
        <div style="text-align: center; padding: 20px;">
          <p><strong>For academic records and registration issues, please contact:</strong></p>
          <br>
          <p><strong>Registrar's Office</strong></p>
          <p>📞 Phone: +251-11-123-4569</p>
          <p>📧 Email: registrar@hilcoe.edu.et</p>
          <p>🏢 Office: Administration Building, Room 101</p>
          <p>🕒 Hours: Monday - Friday, 8:00 AM - 5:00 PM</p>
          <br>
          <p><em>Please have your Student ID and any relevant documents ready when contacting us.</em></p>
        </div>
      `,
      nzOkText: 'Got it',
      nzWidth: 500
    });
  }

  private resetAllStates(): void {
    this.havePreparedCourseOffering = false;
    this.studentTermCourseReg = null;
    this.listOfAddedCourses = [];
    this.filteredAddCourses = [];
    this.listOfCourseAssessment = [];
    this.listOfEquivalentCourses = [];
    this.filteredEquivalentCourses = [];
    this.searchAddCourseText = '';
    this.searchEquivalentCourseText = '';
    this.setOfCheckedId = new Set<string>();
    this.setOfCheckedAddCourses = new Set<string>();
    this.setOfCheckedAssessmentCourses = new Set<string>();
    this.setOfCheckedEquivalentCourses = new Set<string>();
    this.coursePriorities.clear();
    this.selectedBatchCode = null;
    this.regId = null;
    this.batchCode = '';
    this.isLoadingRegularCourses = false;
    this.isLoadingAddCourses = false;
    this.isLoadingAssessmentCourses = false;
    this.isLoadingEquivalentCourses = false;
    this.cdr.detectChanges();
  }

  // TrackBy functions for better performance
  trackByCourseId: TrackByFunction<any> = (index: number, course: any) => course?.id || index;
  trackByTermId: TrackByFunction<any> = (index: number, term: any) => term?.id || index;
  trackByBatchId: TrackByFunction<any> = (index: number, batch: any) => batch?.id || index;
  trackByAssessmentId: TrackByFunction<any> = (index: number, assessment: any) => assessment?.id || index;

}
