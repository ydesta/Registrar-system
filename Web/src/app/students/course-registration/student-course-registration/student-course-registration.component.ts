import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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

@Component({
  selector: 'app-student-course-registration',
  templateUrl: './student-course-registration.component.html',
  styleUrls: ['./student-course-registration.component.scss'],
})
export class StudentCourseRegistrationComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

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

  constructor(
    private _customNotificationService: CustomNotificationService,
    private _studentService: StudentService,
    private batchTermService: BatchTermService,
    private _route: Router,
    private modal: NzModalService,
    private cdr: ChangeDetectorRef
  ) {
    this.searchSubject.pipe(
      takeUntil(this.destroy$),
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchText => {
      this.filterAddCourses();
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
    } else {
      this.getNextAcademicTerm();
    }

    this.applicantUserId = localStorage.getItem('userId');
    if (this.applicantUserId && this.academicTermId) {
      this.resetAllStates();
      this.loadCourseData();
    }
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
    this.seasonTitles = this.nextTerm;
  }

  retryLoading(): void {
    this.loadCourseData();
  }

  private loadCourseData(): void {
    this.isLoadingRegularCourses = true;
    this.isLoadingAddCourses = true;
    this.isLoadingAssessmentCourses = true;

    const regularCourses$ = this._studentService.getStudentCourseOfferingId(
      this.applicantUserId,
      this.academicTermId,
      this.nextAcademicTerm.id
    ).pipe(
      catchError(error => {
        return of(null);
      })
    );

    const addableCourses$ = this._studentService.getListOfAddableTermCourseOffering(
      this.applicantUserId,
      this.academicTermId,
      this.nextAcademicTerm.id
    ).pipe(
      catchError(error => {
        return of([]);
      })
    );

    const assessmentCourses$ = this._studentService.getListOfRetakeTermCourseOffering(
      this.applicantUserId,
      this.academicTermId,
      this.nextAcademicTerm.id
    ).pipe(
      catchError(error => {
        return of([]);
      })
    );

    forkJoin({
      regularCourses: regularCourses$,
      addableCourses: addableCourses$,
      assessmentCourses: assessmentCourses$
    }).pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.resetLoadingStates();
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (results) => {
        console.log("Registration results:    ", results);
        this.handleCourseData(results);
      },
      error: (error) => {
        this._customNotificationService.notification('error', 'Error', 
          'Failed to load course data. Please try again.');
        this.havePreparedCourseOffering = false;
        this.cdr.detectChanges();
      }
    });
  }

  private handleCourseData(results: any): void {
    try {
      if (results.regularCourses) {
        this.resultStatus = results.regularCourses.status;
        if (!results.regularCourses.courseTermOfferings?.length) {
          this.havePreparedCourseOffering = false;
        } else {
          this.studentTermCourseReg = results.regularCourses;
          this.regId = this.studentTermCourseReg.id;
          this.batchCode = results.regularCourses.batchCode;
          this.havePreparedCourseOffering = true;
          this.initializeCheckedCourses();
        }
      } else {
        this.havePreparedCourseOffering = false;
      }

      if (results.addableCourses && Array.isArray(results.addableCourses)) {
        this.processAddableCourses(results.addableCourses);
      } else {
        this.resetAddableCourses();
      }

      if (results.assessmentCourses) {
        this.listOfCourseAssessment = results.assessmentCourses;
        this.setOfCheckedAssessmentCourses = new Set<string>();
        this.listOfCourseAssessment.forEach(course => {
          if (course.isRegistered) {
            this.setOfCheckedAssessmentCourses.add(course.courseId);
          }
        });
        this.refreshAssessmentCheckedStatus();
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
    this.filteredAddCourses = [...courses];
    this.setOfCheckedAddCourses = new Set<string>();
    this.coursePriorities.clear();

    this.filteredAddCourses.forEach(course => {
      if (course.isRegistered) {
        this.setOfCheckedAddCourses.add(course.courseId);
        if (typeof course.priority === 'number' && course.priority > 0) {
          this.coursePriorities.set(course.courseId, course.priority);
        }
      }
    });
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
    this.cdr.detectChanges();
  }

  onSearchTextChange(text: string): void {
    this.searchSubject.next(text);
  }

  private initializeCheckedCourses(): void {
    this.setOfCheckedId = new Set<string>();
    this.studentTermCourseReg.courseTermOfferings.forEach(course => {
      if (course.isRegistered) {
        this.setOfCheckedId.add(course.courseId);
      }
    });
    this.refreshRegularCourseCheckedStatus();
  }

  onItemChecked(id: string, checked: boolean, isAddCourse: boolean = false, isAssessment: boolean = false): void {
    if (isAssessment) {
      this.handleAssessmentCourseSelection(id, checked);
    } else if (isAddCourse) {
      this.handleAddCourseSelection(id, checked);
    } else {
      this.handleRegularCourseSelection(id, checked);
    }
    this.adjustSelectionsToStayWithinLimit();
  }

  private handleAssessmentCourseSelection(id: string, checked: boolean): void {
    const course = this.listOfCourseAssessment.find(c => c.courseId === id);
    if (!course) return;

    if (course.isRegistered && !checked) {
      this._customNotificationService.notification('warning', 'Warning', 'This course is already registered and cannot be unchecked.');
      return;
    }

    if (course && this.isCourseDisabled(course)) {
      this._customNotificationService.notification('warning', 'Warning',
        course.currentGrade !== 'RA'
          ? 'Only courses with RA grade can be selected for assessment'
          : 'This course is not available in the add courses list');
      return;
    }

    if (checked) {
      const courseToAdd = this.listOfCourseAssessment.find(c => c.courseId === id);
      if (this.wouldExceedCreditLimit(courseToAdd)) {
        return;
      }
      this.setOfCheckedAssessmentCourses.add(id);
    } else {
      this.setOfCheckedAssessmentCourses.delete(id);
    }
    this.refreshAssessmentCheckedStatus();
  }

  private handleAddCourseSelection(id: string, checked: boolean): void {
    if (checked) {
      if (this.setOfCheckedAddCourses.size >= this.maxAddCoursesAllowed) {
        this._customNotificationService.notification('warning', 'Warning',
          `You can only select up to ${this.maxAddCoursesAllowed} additional courses.`);
        return;
      }
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
    if (course && (this.totalSelectedCreditHours + course.creditHours) > this.getMaxAllowedCreditHours()) {
      const cgpa = this.studentTermCourseReg?.cgpa || 0;
      let message = '';
      
      if (cgpa === 0) {
        message = `Adding this course would exceed your maximum allowed credit hours of 19 for new students.`;
      } else {
        message = `Adding this course would exceed your maximum allowed credit hours of ${this.getMaxAllowedCreditHours()} based on your CGPA of ${this.studentTermCourseReg?.cgpa.toFixed(2)}.`;
      }
      
      this._customNotificationService.notification('warning', 'Credit Hour Warning', message);
      return true;
    }
    return false;
  }

  get totalSelectedCreditHours(): number {
    const regular = this.studentTermCourseReg?.courseTermOfferings
      ?.filter(course => this.setOfCheckedId.has(course.courseId))
      ?.reduce((total, course) => total + course.creditHours, 0) || 0;

    const assessment = this.listOfCourseAssessment
      ?.filter(course => this.setOfCheckedAssessmentCourses.has(course.courseId))
      ?.reduce((total, course) => total + course.creditHours, 0) || 0;

    const add = this.filteredAddCourses
      ?.filter(course => this.setOfCheckedAddCourses.has(course.courseId))
      ?.reduce((total, course) => total + course.creditHours, 0) || 0;

    return regular + assessment + add;
  }

  isCourseDisabled(course: any): boolean {
    if (course.isRegistered) {
      return false;
    }
    if (course.currentGrade !== 'RA') {
      return true;
    }
    const isInAddedCourses = this.listOfAddedCourses?.some(
      addedCourse => addedCourse.courseId === course.courseId && addedCourse.currentGrade === 'RA'
    );

    const isInCourseOfferings = this.studentTermCourseReg?.courseTermOfferings?.some(
      offeringCourse => offeringCourse.courseId === course.courseId
    );
    return !(isInAddedCourses || isInCourseOfferings);
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
    this._studentService
      .getListOfRetakeTermCourseOffering(applicantUserId, term, id)
      .subscribe({
        next: (res) => {
          this.listOfCourseAssessment = res;
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
            this.filteredAddCourses = [...res];
            this.setOfCheckedAddCourses = new Set<string>();
            this.coursePriorities.clear();
            this.filteredAddCourses.forEach(course => {
              if (course.isRegistered) {
                this.setOfCheckedAddCourses.add(course.courseId);
                if (typeof course.priority === 'number' && course.priority > 0) {
                  this.coursePriorities.set(course.courseId, course.priority);
                }
              }
            });
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
        this.batchCode = res.batchCode
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
      .filter(course => this.setOfCheckedId.has(course.courseId))
      .reduce((total, data) => total + data.creditHours, 0);
  }

  getTotalAmount() {
    if (!this.studentTermCourseReg?.courseTermOfferings) {
      return 0;
    }
    return this.studentTermCourseReg.courseTermOfferings
      .filter(course => this.setOfCheckedId.has(course.courseId))
      .reduce((total, data) => total + data.totalAmount, 0);
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

  getMaxAllowedCreditHours(): number {
    const cgpa = this.studentTermCourseReg?.cgpa || 0;
    if (cgpa === 0) {
      return 19;
    } else if (cgpa >= 1.82) {
      return 19;
    } else if (cgpa >= 1.66) {
      return 15;
    } else if (cgpa >= 1.5) {
      return 10;
    } else {
      return 5;
    }
  }

  onAllChecked(checked: boolean, type: 'regular' | 'add' | 'assessment'): void {
    if (type === 'regular') {
      if (checked) {
        const totalCreditHours = this.studentTermCourseReg?.courseTermOfferings?.reduce((total, course) => total + course.creditHours, 0) || 0;
        const maxAllowed = this.getMaxAllowedCreditHours();

        if (totalCreditHours > maxAllowed) {
          this._customNotificationService.notification('warning', 'Credit Hour Warning',
            `Selecting all courses would exceed your maximum allowed credit hours of ${maxAllowed} based on your CGPA of ${this.studentTermCourseReg?.cgpa.toFixed(2)}.`);
          return;
        }
      }

      this.studentTermCourseReg?.courseTermOfferings.forEach(course => {
        if (checked) {
          this.setOfCheckedId.add(course.courseId);
      } else {
          this.setOfCheckedId.delete(course.courseId);
        }
      });
      this.checkedRegularCourses = checked;
      this.indeterminateRegularCourses = false;
    } else if (type === 'add') {
      if (checked) {
        const coursesToSelect = this.filteredAddCourses.slice(0, this.maxAddCoursesAllowed);
        coursesToSelect.forEach(course => {
          this.setOfCheckedAddCourses.add(course.courseId);
          this.coursePriorities.set(course.courseId, 0);
        });
          this._customNotificationService.notification('warning', 'Warning',
          `Only the first ${this.maxAddCoursesAllowed} courses were selected due to the maximum limit.`);
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
        const totalCreditHours = this.listOfCourseAssessment?.reduce((total, course) => total + course.creditHours, 0) || 0;
        const maxAllowed = this.getMaxAllowedCreditHours();

        if (totalCreditHours > maxAllowed) {
          this._customNotificationService.notification('warning', 'Credit Hour Warning',
            `Selecting all assessment courses would exceed your maximum allowed credit hours of ${maxAllowed} based on your CGPA of ${this.studentTermCourseReg?.cgpa.toFixed(2)}.`);
          return;
        }
      }

      this.listOfCourseAssessment.forEach(course => {
        if (checked) {
          this.setOfCheckedAssessmentCourses.add(course.courseId);
      } else {
          this.setOfCheckedAssessmentCourses.delete(course.courseId);
        }
      });
      this.checkedAssessmentCourses = checked;
      this.indeterminateAssessmentCourses = false;
    }

    this.adjustSelectionsToStayWithinLimit();
  }

  private adjustSelectionsToStayWithinLimit(): void {
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

    // Combine all courses and sort by credit hours
    const allCourses = [...regularCourses, ...addCourses, ...assessmentCourses]
      .sort((a, b) => b.creditHours - a.creditHours);

    // Keep track of which courses to keep
    const coursesToKeep = new Set<string>();
    let runningTotal = 0;

    // Try to keep courses with higher credit hours first
    for (const course of allCourses) {
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

    // Refresh all check states
      this.refreshRegularCourseCheckedStatus();
    this.refreshAddCourseCheckedStatus();
    this.refreshAssessmentCheckedStatus();

    if (currentTotal > maxAllowed) {
      this._customNotificationService.notification('warning', 'Credit Hour Warning',
        `Some courses were automatically unselected to stay within your maximum allowed credit hours of ${maxAllowed} based on your CGPA of ${this.studentTermCourseReg?.cgpa.toFixed(2)}.`);
    }
  }

  private checkCreditHours(): void {
    if (this.totalSelectedCreditHours > 19) {
      this._customNotificationService.notification('warning', 'Credit Hour Warning',
        `You have selected ${this.totalSelectedCreditHours} credit hours, which exceeds the recommended limit of 19 credit hours.`);
    }
  }

  getCoursePriority(courseId: string): number {
    return this.coursePriorities.get(courseId) ?? 0;
  }

  updateCoursePriority(courseId: string, priority: number): void {
    if (priority < 0 || priority > 3) {
      this._customNotificationService.notification('error', 'Error', 'Priority must be between 1 and 3');
      return;
    }

    // Check if this priority is already assigned to another course
    const existingCourseWithPriority = Array.from(this.coursePriorities.entries())
      .find(([id, p]) => id !== courseId && p === priority);

    if (existingCourseWithPriority) {
      this._customNotificationService.notification('error', 'Error', `Priority ${priority} is already assigned to another course`);
      return;
    }

    this.coursePriorities.set(courseId, priority);
  }

  getTotalAddedCreditHours(): number {
    if (!this.filteredAddCourses) {
      return 0;
    }
    return this.filteredAddCourses
      .filter(course => this.setOfCheckedAddCourses.has(course.courseId))
      .reduce((total, course) => total + course.creditHours, 0);
  }
  getTotalAddedAmount(): number {
    if (!this.filteredAddCourses) {
      return 0;
    }
    return this.filteredAddCourses
      .filter(course => this.setOfCheckedAddCourses.has(course.courseId))
      .reduce((total, course) => total + course.totalAmount, 0);
  }
  onCurrentPageDataChange(listOfCurrentPageData: readonly any[]): void {
    this.listOfCurrentPageData = listOfCurrentPageData;
    this.refreshRegularCourseCheckedStatus();
  }
  sendRequest(): void {
    // Validate required data before proceeding
    if (!this.studentTermCourseReg) {
      this._customNotificationService.notification('error', 'Error', 'Student course registration data is not available. Please refresh the page and try again.');
      return;
    }

    if (!this.studentTermCourseReg.courseTermOfferings) {
      this._customNotificationService.notification('error', 'Error', 'No course offerings available for registration.');
      return;
    }

    // Check if any courses are selected
    const hasRegularCourses = this.setOfCheckedId.size > 0;
    const hasAddCourses = this.setOfCheckedAddCourses.size > 0;
    const hasAssessmentCourses = this.setOfCheckedAssessmentCourses.size > 0;

    if (!hasRegularCourses && !hasAddCourses && !hasAssessmentCourses) {
      this._customNotificationService.notification('warning', 'Warning', 'Please select at least one course for registration.');
      return;
    }

    this.isSubmitting = true;
    const semester = "Semester";

    try {
      // Build assessment courses array with proper error handling
      const assessmentCourses: SelectedCourses[] = Array.from(this.setOfCheckedAssessmentCourses)
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
        });

      // Build regular courses array with proper error handling
      const regularCourses: SelectedCourses[] = Array.from(this.setOfCheckedId)
        .map(courseId => {
          const course = this.studentTermCourseReg.courseTermOfferings.find(c => c.courseId === courseId);
          if (!course) {
            throw new Error(`Regular course with ID ${courseId} not found`);
          }
          return course;
        })
        .filter(course => course && course.isPaid === false)
        .map(course => ({
          courseId: course.courseId,
          registrationStatus: RegistrationStatus.Regular,
          priority: 0,
          totalAmount: course.totalAmount || 0,
          batchCode: course.batchCode || null
        }));

      // Build add courses array with proper error handling
      const addCourses: SelectedCourses[] = Array.from(this.setOfCheckedAddCourses)
        .map(courseId => {
          const course = this.listOfAddedCourses?.find(c => c.courseId === courseId);
          if (!course) {
            throw new Error(`Add course with ID ${courseId} not found`);
          }
          return {
            courseId: courseId,
            registrationStatus: RegistrationStatus.Add,
            priority: this.coursePriorities.get(courseId) ?? 0,
            totalAmount: course.totalAmount || 0,
            batchCode: course.batchCode || null
          };
        });

      // Validate add course priorities
      if (addCourses.length > 0) {
        const hasUnassignedPriority = addCourses.some(course => course.priority === 0);
        if (hasUnassignedPriority) {
          this._customNotificationService.notification('error', 'Error', 'All selected add course requests must have a priority assigned');
          this.isSubmitting = false;
          return;
        }
      }

      // Create student course offering object
      const studentCourseOffering = new StudentCourseOffering();
      studentCourseOffering.academicTermCode = this.studentTermCourseReg.academicProgramId;
      studentCourseOffering.studentId = this.studentTermCourseReg.studId;
      studentCourseOffering.termCourseOfferingId = this.studentTermCourseReg.termCourseOfferingId;
      studentCourseOffering.selectedCourses = [
        ...regularCourses,
        ...addCourses,
        ...assessmentCourses
      ];

      // Validate the offering object
      if (!studentCourseOffering.academicTermCode || !studentCourseOffering.studentId || !studentCourseOffering.termCourseOfferingId) {
        this._customNotificationService.notification('error', 'Error', 'Missing required registration information. Please refresh and try again.');
        this.isSubmitting = false;
        return;
      }

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
                this._route.navigateByUrl(`banks/add-student-payment?registrationid=${this.regId}&code=${this.batchCode}&type=${semester}`);
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
                this._route.navigateByUrl(`banks/add-student-payment?registrationid=${this.registrationId}&code=${this.batchCode}&type=${semester}`);
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
    this._route.navigateByUrl('students/manage-student-course-registration');
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
        this.academicTermId = res.termId;
        this.nextTermYear = res.year;
        const termDescription = this.getAcademicTermStatusDescription(res.termId);
        this.nextTerm = `🎓 Registration : ${termDescription} ${res.year}`;
        this.seasonTitles = this.nextTerm;
      },
      error: (error) => {
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
    if (!this.studentTermCourseReg || !this.studentTermCourseReg.courseTermOfferings) {
      return "<p>No data available to print.</p>";
    }

    const paymentStatus = (this.studentTermCourseReg?.coursePayment?.length ?? 0) > 0
      ? "REGISTERED AND PAID"
      : "NOT REGISTERED AND NOT PAID";

    const courseOfferingContent = this.studentTermCourseReg.courseTermOfferings.map((course: any) => `
        <tr style="border: 1px solid #ddd;">
          <td style="padding: 8px; border: 1px solid #ddd;">${course.courseCode}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${course.courseTitle}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: left;">${course.creditHours}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: left;">${course.totalAmount}</td>
        </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>HiLCoE Registration Slip</title>
          <style>
              @page {
                size: letter;
                margin: 0.5in;
              }
              
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                background-color: #fff;
                color: #333;
              }
  
              .page-wrapper {
                max-width: 800px;
                margin: 0 auto;
                background: #fff;
                padding: 20px;
                position: relative;
              }
  
              .header {
                text-align: center;
                border-bottom: 3px solid #093e96;
                padding-bottom: 15px;
                margin-bottom: 20px;
                position: relative;
              }
  
              .header img {
                max-height: 80px;
                width: auto;
                margin-bottom: 10px;
              }
  
              .header h2 { 
                margin: 0; 
                color: #093e96; 
                font-size: 24px;
                font-weight: 600;
              }
  
              .sub-header {
                text-align: center;
                font-size: 18px;
                font-weight: bold;
                color: #093e96;
                margin-bottom: 25px;
              }
  
              .student-info {
                display: flex;
                justify-content: space-between;
                background: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 20px;
                border: 1px solid #e8e8e8;
              }
  
              .student-info div {
                flex: 1;
              }
  
              .student-info p {
                margin: 8px 0;
                font-size: 14px;
                line-height: 1.4;
              }
  
              .student-info .label {
                font-weight: 600;
                color: #666;
              }
  
              .student-info .value {
                color: #333;
              }
  
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
                font-size: 14px;
              }
  
              th {
                background-color: #093e96;
                color: white;
                padding: 12px 8px;
                text-align: left;
                font-weight: 600;
                border: 1px solid #ddd;
              }
  
              td {
                padding: 8px;
                border: 1px solid #ddd;
              }
  
              tfoot td {
                background-color: #f8f9fa;
                font-weight: bold;
                padding: 12px 8px;
              }
  
              .signature-section {
                display: flex;
                justify-content: space-between;
                margin-top: 40px;
                padding-top: 20px;
                border-top: 2px solid #093e96;
              }
  
              .signature-box {
                width: 45%;
                text-align: center;
              }
  
              .signature-box p {
                margin: 5px 0;
                font-size: 14px;
              }
  
              .signature-line {
                border-top: 1px solid #333;
                margin-top: 50px;
                width: 80%;
                margin-left: auto;
                margin-right: auto;
              }
  
              .watermark {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-45deg);
                font-size: 48px;
                font-weight: bold;
                color: rgba(9, 62, 150, 0.1);
                text-transform: uppercase;
                z-index: 1;
                pointer-events: none;
                user-select: none;
                white-space: nowrap;
              }
  
              .logo-watermark {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-45deg);
                width: 400px;
                height: 400px;
                background-image: url('${window.location.origin}/assets/images/logo.png');
                background-size: contain;
                background-repeat: no-repeat;
                background-position: center;
                opacity: 0.05;
                z-index: 1;
                pointer-events: none;
                user-select: none;
              }
  
              .footer {
                margin-top: 30px;
                text-align: center;
                font-size: 12px;
                color: #666;
                border-top: 1px solid #ddd;
                padding-top: 15px;
              }
          </style>
      </head>
      <body>
          <div class="page-wrapper" style="max-width: 800px; margin: 0 auto; background: #fff; padding: 20px; position: relative;">
            <div class="watermark" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 48px; font-weight: bold; color: rgba(9, 62, 150, 0.1); text-transform: uppercase; z-index: 1; pointer-events: none; user-select: none; white-space: nowrap;">${paymentStatus}</div>
            <div class="logo-watermark" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); width: 400px; height: 400px; background-image: url('${window.location.origin}/assets/images/logo.png'); background-size: contain; background-repeat: no-repeat; background-position: center; opacity: 0.05; z-index: 1; pointer-events: none; user-select: none;"></div>
  
            <div class="header" style="text-align: center; border-bottom: 3px solid #093e96; padding-bottom: 15px; margin-bottom: 20px; position: relative;">
                <img height="60" src="${window.location.origin}/assets/images/logo.png" alt="Logo" style="max-height: 80px; width: auto; margin-bottom: 10px;" />
                <h2 style="margin: 0; color: #093e96; font-size: 24px; font-weight: 600;">HiLCoE School of Computer Science and Technology</h2>
            </div>   
            <div class="sub-header" style="text-align: center; font-size: 18px; font-weight: bold; color: #093e96; margin-bottom: 25px;">${this.seasonTitles} Slip</div>
  
            <div class="student-info" style="display: flex; justify-content: space-between; background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e8e8e8;">
                <div style="flex: 1;">
                    <p style="margin: 8px 0; font-size: 14px; line-height: 1.4;"><span style="font-weight: 600; color: #666;">Student Name:</span> <span style="color: #333;">${this.studentTermCourseReg?.fullName || 'N/A'}</span></p>
                    <p style="margin: 8px 0; font-size: 14px; line-height: 1.4;"><span style="font-weight: 600; color: #666;">Student ID:</span> <span style="color: #333;">${this.studentTermCourseReg?.studentId || 'N/A'}</span></p>
                </div>
                <div style="flex: 1;">
                    <p style="margin: 8px 0; font-size: 14px; line-height: 1.4;"><span style="font-weight: 600; color: #666;">Academic Year:</span> <span style="color: #333;">${this.getYearNumberDescription(this.studentTermCourseReg?.academicTermYear)}</span></p>
                    <p style="margin: 8px 0; font-size: 14px; line-height: 1.4;"><span style="font-weight: 600; color: #666;">Batch Code:</span> <span style="color: #333;">${this.studentTermCourseReg?.batchCode || 'N/A'}</span></p>
                    <p style="margin: 8px 0; font-size: 14px; line-height: 1.4;"><span style="font-weight: 600; color: #666;">FS Number:</span> <span style="color: #333;">____________________</span></p>
                </div>
            </div>
  
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;">
                <thead>
                    <tr>
                        <th style="background-color: #093e96; color: white; padding: 12px 8px; text-align: left; font-weight: 600; border: 1px solid #ddd;">Course Code</th>
                        <th style="background-color: #093e96; color: white; padding: 12px 8px; text-align: left; font-weight: 600; border: 1px solid #ddd;">Course Title</th>
                        <th style="background-color: #093e96; color: white; padding: 12px 8px; text-align: left; font-weight: 600; border: 1px solid #ddd;">Credit Hours</th>
                        <th style="background-color: #093e96; color: white; padding: 12px 8px; text-align: left; font-weight: 600; border: 1px solid #ddd;">Total Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${courseOfferingContent}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="2" style="background-color: #f8f9fa; font-weight: bold; padding: 12px 8px; border: 1px solid #ddd;">Total</td>
                        <td style="background-color: #f8f9fa; font-weight: bold; padding: 12px 8px; border: 1px solid #ddd;">${this.getTotalCreditHours()}</td>
                        <td style="background-color: #f8f9fa; font-weight: bold; padding: 12px 8px; border: 1px solid #ddd;">${this.getTotalAmount().toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
                    </tr>
                </tfoot>
            </table>
  
            <div class="signature-section" style="display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; border-top: 2px solid #093e96;">
                <div class="signature-box" style="width: 45%; text-align: center;">
                    <p style="margin: 5px 0; font-size: 14px;">Student Signature</p>
                    <div class="signature-line" style="border-top: 1px solid #333; margin-top: 50px; width: 80%; margin-left: auto; margin-right: auto;"></div>
                </div>
                <div class="signature-box" style="width: 45%; text-align: center;">
                    <p style="margin: 5px 0; font-size: 14px;">Authorized By</p>
                    <div class="signature-line" style="border-top: 1px solid #333; margin-top: 50px; width: 80%; margin-left: auto; margin-right: auto;"></div>
                </div>
            </div>
  
            <div class="footer" style="margin-top: 30px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 15px;">
                <p style="margin: 0;">This slip is a proof of registration and should be kept for reference.</p>
            </div>
          </div>
      </body>
      </html>
    `;
  }

  // Function to handle printing
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
    if (!this.searchAddCourseText) {
      this.filteredAddCourses = [...this.listOfAddedCourses];
      return;
    }

    const searchText = this.searchAddCourseText.toLowerCase();
    this.filteredAddCourses = this.listOfAddedCourses.filter(course =>
      course.courseCode.toLowerCase().includes(searchText) ||
      course.courseTitle.toLowerCase().includes(searchText)
    );
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

  isRegularCourseDisabled(course: any): boolean {

    if (course.currentGrade === 'RA') {
      return true;
    }

    const passingGrades = ['A+', 'A', 'B', 'B+', 'C', 'D'];
    if (course.courseStatus === 'Not Taken') {
      return false;
    }
    if (course.courseStatus === 'Taken') {
      if (passingGrades.includes(course.currentGrade) || course.currentGrade === '') {
        return true;
      } else if (course.currentGrade === 'F' || course.currentGrade === 'RC') {
        return false;
      } else {
        return true;
      }
    }

    return true;
  }

  getTotalAssessmentCreditHours(): number {
    if (!this.listOfCourseAssessment) {
      return 0;
    }
    return this.listOfCourseAssessment
      .filter(course => this.setOfCheckedAssessmentCourses.has(course.courseId))
      .reduce((total, course) => total + course.creditHours, 0);
  }
  getTotalAssessmentAmount(): number {
    if (!this.listOfCourseAssessment) {
      return 0;
    }
    return this.listOfCourseAssessment
      .filter(course => this.setOfCheckedAssessmentCourses.has(course.courseId))
      .reduce((total, course) => total + course.totalAmount, 0);
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
    if (this.totalSelectedCreditHours > 19) {
      this.modal.confirm({
        nzTitle: 'Credit Hour Limit Exceeded',
        nzContent: `You have selected ${this.totalSelectedCreditHours} credit hours, which exceeds the recommended limit of 19 credit hours. Would you like to proceed with the registration?`,
        nzOkText: 'Yes, Proceed',
        nzOkType: 'primary',
        nzOkDanger: true,
        nzCancelText: 'No, Cancel',
        nzOnOk: () => {
          this._customNotificationService.notification('warning', 'Credit Hour Warning', 
            'You are proceeding with more than 19 credit hours. This may affect your academic performance.');
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

  private resetAllStates(): void {
    this.havePreparedCourseOffering = false;
    this.studentTermCourseReg = null;
    this.listOfAddedCourses = [];
    this.filteredAddCourses = [];
    this.listOfCourseAssessment = [];
    this.setOfCheckedId = new Set<string>();
    this.setOfCheckedAddCourses = new Set<string>();
    this.setOfCheckedAssessmentCourses = new Set<string>();
    this.coursePriorities.clear();
    this.selectedBatchCode = null;
    this.regId = null;
    this.batchCode = '';
    this.isLoadingRegularCourses = false;
    this.isLoadingAddCourses = false;
    this.isLoadingAssessmentCourses = false;
    this.cdr.detectChanges();
  }
}
