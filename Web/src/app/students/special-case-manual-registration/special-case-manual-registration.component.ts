import { Component, OnInit, ViewChild } from '@angular/core';
import { StudentSearchComponent } from 'src/app/shared-module/shared/components/student-search/student-search.component';
import { StudentService } from '../services/student.service';
import { StudentViewModel } from '../models/student-view-model.model';
import { CourseBreakDownOffering } from '../models/course-break-down-offering.model';
import { StaticData } from 'src/app/admission-request/model/StaticData';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ACADEMIC_TERM_STATUS } from 'src/app/common/constant';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ConfirmationModalComponent, ConfirmationModalData } from './confirmation-modal/confirmation-modal.component';
import { SpecialCaseManualRegistrationRequest, SelectedCourses } from '../models/special-case-manual-registration-request.model';
import { RegistrationStatus } from 'src/app/common/constant';

@Component({
  selector: 'app-special-case-manual-registration',
  templateUrl: './special-case-manual-registration.component.html',
  styleUrls: ['./special-case-manual-registration.component.scss']
})
export class SpecialCaseManualRegistrationComponent implements OnInit {
  @ViewChild(StudentSearchComponent) studentSearchComponent!: StudentSearchComponent;

  studentList: StudentViewModel;
  courseList: CourseBreakDownOffering[] = [];
  unregisteredCourses: CourseBreakDownOffering[] = [];
  listOfTerm: StaticData[] = [];
  yearList: number[] = [];
  formCourseOffered: FormGroup;
  showSearchForm = true;

  // Store student code from search
  studentCode: string = '';

  // Course selection tracking
  selectedRegisteredCourses: number[] = [];
  selectedUnregisteredCourses: string[] = []; // Stores unique keys: courseId|batchCode

  // Form validation states
  canSubmit = false;
  canDelete = false;

  // Filter properties
  registeredCoursesFilter: string = '';
  unregisteredCoursesFilter: string = '';
  filteredRegisteredCourses: CourseBreakDownOffering[] = [];
  filteredUnregisteredCourses: CourseBreakDownOffering[] = [];

  // Sorting properties
  sortColumn: string = '';
  sortOrder: string | null = null;

  // Course selection properties
  allCourses: CourseBreakDownOffering[] = [];
  fullName = localStorage.getItem('firstName') + " " + localStorage.getItem('lastName');

  // Confirmation modal properties
  showConfirmationModal = false;
  confirmationModalData: ConfirmationModalData;
  constructor(
    private studentServices: StudentService,
    private _fb: FormBuilder,
    private message: NzMessageService
  ) {
    const currentYear = new Date();
    this.yearList = this.getYearRange(currentYear.getFullYear());
    this.createCourseOffering();
  }

  ngOnInit(): void {
    this.getListOfAcademicTermStatus();
    this.updateSubmitButtonState();
  }

  private createCourseOffering() {
    this.formCourseOffered = this._fb.group({
      termId: [null, [Validators.required]],
      termYear: [null, [Validators.required]],
      batchCode: [null, []],
      selectedCourse: [null]
    });

    // Subscribe to termId changes
    this.formCourseOffered.get('termId')?.valueChanges.subscribe(() => {
      this.updateSubmitButtonState();
      this.loadUnregisteredCourses();
    });

    // Subscribe to termYear changes
    this.formCourseOffered.get('termYear')?.valueChanges.subscribe(() => {
      this.updateSubmitButtonState();
      this.loadUnregisteredCourses();
    });
  }

  onSearchSubmitted(studentId: string): void {
    // Store the student code from the search
    this.studentCode = studentId;
    
    this.selectedRegisteredCourses = [];
    this.selectedUnregisteredCourses = [];
    this.canDelete = false;
    this.canSubmit = false;
    
    // Get registered courses first to populate studentList
    this.getRegisteredCourses(studentId);
    // Unregistered courses will be loaded when termId and termYear are selected
  }

  private getRegisteredCourses(studentId: string): void {
    this.studentServices.getStudentRegisteredCourseList(studentId).subscribe({
      next: (studentData) => {
        this.studentList = studentData;
        this.courseList = studentData.courseTermOfferings || [];
        this.filteredRegisteredCourses = [...this.courseList];
        this.showSearchForm = false;
        this.updateAllCourses();
        this.updateSubmitButtonState();
        // Load unregistered courses after student data is loaded (if termId and termYear are already selected)
        this.loadUnregisteredCourses();
      },
      error: () => {
        this.showSearchForm = false;
      }
    });
  }

  private loadUnregisteredCourses(): void {
    const termId = this.formCourseOffered.get('termId')?.value;
    const termYear = this.formCourseOffered.get('termYear')?.value;

    // Only load if all required values are available (studentCode from search, termId, and termYear)
    if (termId && termYear && this.studentCode) {
      this.studentServices.getManualTermCourseOfferingProgramBased(
        this.studentCode,
        termId,
        termYear
      ).subscribe({
        next: (unregisteredCourses) => {
          this.unregisteredCourses = unregisteredCourses || [];
          this.selectedUnregisteredCourses = [];
          // Unpaid (and paid) existing registrations start selected so unpaid can be unselected.
          this.autoSelectRegisteredCourses();
          this.filterUnregisteredCourses();
          this.updateAllCourses();
          this.updateSubmitButtonState();
        },
        error: () => {
          this.unregisteredCourses = [];
          this.filteredUnregisteredCourses = [];
          this.sortColumn = '';
          this.sortOrder = null;
          this.updateAllCourses();
        }
      });
    } else {
      // Clear unregistered courses if required values are missing
      this.unregisteredCourses = [];
      this.filteredUnregisteredCourses = [];
      this.sortColumn = '';
      this.sortOrder = null;
      this.updateAllCourses();
    }
  }



  showSearch(): void {
    this.showSearchForm = true;
    if (this.studentSearchComponent) {
      this.studentSearchComponent.resetForm();
    }
    this.resetForm();
  }

  resetForm(): void {
    this.studentList = null;
    this.courseList = [];
    this.unregisteredCourses = [];
    this.allCourses = [];
    this.filteredRegisteredCourses = [];
    this.filteredUnregisteredCourses = [];
    this.registeredCoursesFilter = '';
    this.unregisteredCoursesFilter = '';
    this.selectedRegisteredCourses = [];
    this.selectedUnregisteredCourses = [];
    this.canSubmit = false;
    this.canDelete = false;
    this.studentCode = ''; // Reset student code
    this.formCourseOffered.reset();
  }

  // Handle registered course selection
  onRegisteredCourseSelectionChange(courseId: number, checked: boolean): void {
    if (checked) {
      this.selectedRegisteredCourses.push(courseId);
    } else {
      this.selectedRegisteredCourses = this.selectedRegisteredCourses.filter(id => id !== courseId);
    }
    this.updateSubmitButtonState();
  }

  // Generate unique key for a course (courseId + batchCode)
  private getCourseUniqueKey(course: CourseBreakDownOffering): string {
    return `${String(course.courseId).toLowerCase()}|${course.batchCode || ''}`;
  }

  /** RA and RC courses can be selected again for retake on manual registration. */
  private isRetakeGrade(course: CourseBreakDownOffering): boolean {
    const grade = String(course?.currentGrade || '').trim().toUpperCase();
    return grade === 'RA' || grade === 'RC';
  }

  // Handle unregistered course selection
  onUnregisteredCourseSelectionChange(course: CourseBreakDownOffering, checked: boolean): void {
    // Paid courses stay locked, except RA and RC, which can be selected again.
    if (course.isPaid === true && !this.isRetakeGrade(course)) {
      this.message.warning('This course is already paid and cannot be changed here.');
      return;
    }

    const uniqueKey = this.getCourseUniqueKey(course);
    const courseId = String(course.courseId).toLowerCase();
    if (checked) {
      this.selectedUnregisteredCourses = this.selectedUnregisteredCourses.filter(key => {
        const [existingCourseId] = key.split('|');
        return existingCourseId !== courseId;
      });
      this.selectedUnregisteredCourses.push(uniqueKey);
      this.updateSubmitButtonState();
      return;
    }

    // Paid RA or RC retake — just uncheck; do not delete the original paid row.
    if (course.isPaid === true && this.isRetakeGrade(course)) {
      this.selectedUnregisteredCourses = this.selectedUnregisteredCourses.filter(key => key !== uniqueKey);
      this.updateSubmitButtonState();
      return;
    }

    // Uncheck: if already on the student (unpaid registered), remove from DB
    if (course.isRegistered === true && course.id) {
      this.removeUnpaidRegisteredCourse(course, uniqueKey);
      return;
    }

    this.selectedUnregisteredCourses = this.selectedUnregisteredCourses.filter(key => key !== uniqueKey);
    this.updateSubmitButtonState();
  }

  private removeUnpaidRegisteredCourse(course: CourseBreakDownOffering, uniqueKey: string): void {
    const takenCourseId = course.id;
    if (!takenCourseId) {
      this.selectedUnregisteredCourses = this.selectedUnregisteredCourses.filter(key => key !== uniqueKey);
      course.isRegistered = false;
      this.updateSubmitButtonState();
      return;
    }

    this.studentServices.updateTakenCourses([takenCourseId], this.fullName).subscribe({
      next: () => {
        this.selectedUnregisteredCourses = this.selectedUnregisteredCourses.filter(key => key !== uniqueKey);
        course.isRegistered = false;
        course.id = 0;
        course.courseStatus = 'Not Taken';

        this.courseList = this.courseList.filter(c => c.id !== takenCourseId);
        if (this.studentList) {
          this.studentList.courseTermOfferings = this.courseList;
        }
        this.selectedRegisteredCourses = this.selectedRegisteredCourses.filter(id => id !== takenCourseId);
        this.filterRegisteredCourses();
        this.message.success(`${course.courseCode || 'Course'} removed successfully.`);
        this.updateSubmitButtonState();
      },
      error: () => {
        if (!this.selectedUnregisteredCourses.includes(uniqueKey)) {
          this.selectedUnregisteredCourses.push(uniqueKey);
        }
        this.message.error('Failed to remove course. Please try again.');
        this.updateSubmitButtonState();
      }
    });
  }

  // Check if a course should be disabled (paid registered, or same courseId other batch selected)
  isUnregisteredCourseDisabled(course: CourseBreakDownOffering): boolean {
    // Paid courses stay locked. Paid RA and RC stay enabled so the registrar can register a retake.
    if (course.isPaid === true && !this.isRetakeGrade(course)) {
      return true;
    }

    const currentCourseKey = this.getCourseUniqueKey(course);
    if (this.selectedUnregisteredCourses.includes(currentCourseKey)) {
      return false;
    }

    const courseId = String(course.courseId).toLowerCase();
    for (const selectedKey of this.selectedUnregisteredCourses) {
      const [selectedCourseId] = selectedKey.split('|');
      if (selectedCourseId === courseId) {
        return true;
      }
    }
    return false;
  }

  /** Unpaid courses already on the student — shown selected so the registrar can unselect to remove. */
  private isExistingUnpaidRegistration(course: CourseBreakDownOffering): boolean {
    if (!course || course.isPaid === true) {
      return false;
    }
    if (course.isRegistered === true) {
      return true;
    }
    if (course.id != null && Number(course.id) > 0) {
      return true;
    }
    const status = (course.courseStatus || '').toLowerCase();
    return status === 'unpaid' || status === 'manual registration';
  }

  // Auto-select existing registrations (unpaid can later be unchecked to remove)
  private autoSelectRegisteredCourses(): void {
    for (const course of this.unregisteredCourses) {
      // Paid RA and RC are left unchecked so the registrar can explicitly select a retake.
      if (course.isPaid === true && this.isRetakeGrade(course)) {
        continue;
      }

      const shouldSelect =
        course.isPaid === true ||
        course.isRegistered === true ||
        this.isExistingUnpaidRegistration(course);

      if (!shouldSelect) {
        continue;
      }

      const uniqueKey = this.getCourseUniqueKey(course);
      const courseId = String(course.courseId).toLowerCase();
      if (!this.selectedUnregisteredCourses.includes(uniqueKey)) {
        this.selectedUnregisteredCourses = this.selectedUnregisteredCourses.filter(key => {
          const [existingCourseId] = key.split('|');
          return existingCourseId !== courseId;
        });
        this.selectedUnregisteredCourses.push(uniqueKey);
      }

      // Normalize flags so unpaid rows stay selectable/unselectable consistently
      if (this.isExistingUnpaidRegistration(course)) {
        course.isRegistered = true;
        course.isPaid = false;
      }
    }
  }

  // Handle select all registered courses
  onSelectAllRegisteredCourses(checked: boolean): void {
    if (checked) {
      this.selectedRegisteredCourses = this.filteredRegisteredCourses.map(course => course.id);
    } else {
      this.selectedRegisteredCourses = [];
    }
    this.updateSubmitButtonState();
  }

  // Handle select all unregistered courses
  onSelectAllUnregisteredCourses(checked: boolean): void {
    if (checked) {
      const courseIdMap = new Map<string, CourseBreakDownOffering>();
      this.filteredUnregisteredCourses
        .filter(course => !this.isUnregisteredCourseDisabled(course))
        .forEach(course => {
          if (!courseIdMap.has(course.courseId)) {
            courseIdMap.set(course.courseId, course);
          }
        });

      Array.from(courseIdMap.values()).forEach(course => {
        const key = this.getCourseUniqueKey(course);
        this.selectedUnregisteredCourses = this.selectedUnregisteredCourses.filter(existingKey => {
          const [existingCourseId] = existingKey.split('|');
          return existingCourseId !== course.courseId;
        });
        if (!this.selectedUnregisteredCourses.includes(key)) {
          this.selectedUnregisteredCourses.push(key);
        }
      });
      this.updateSubmitButtonState();
      return;
    }

    // Uncheck all: remove unpaid registered rows from DB, clear other selections
    const toRemove = this.filteredUnregisteredCourses.filter(course =>
      course.isRegistered === true && !course.isPaid && !!course.id &&
      this.selectedUnregisteredCourses.includes(this.getCourseUniqueKey(course))
    );
    const idsToDelete = toRemove.map(c => c.id);

    const clearLocalSelections = () => {
      this.selectedUnregisteredCourses = [];
      toRemove.forEach(course => {
        course.isRegistered = false;
        course.id = 0;
        course.courseStatus = 'Not Taken';
      });
      if (idsToDelete.length) {
        this.courseList = this.courseList.filter(c => !idsToDelete.includes(c.id));
        if (this.studentList) {
          this.studentList.courseTermOfferings = this.courseList;
        }
        this.selectedRegisteredCourses = this.selectedRegisteredCourses.filter(id => !idsToDelete.includes(id));
        this.filterRegisteredCourses();
      }
      this.updateSubmitButtonState();
    };

    if (idsToDelete.length === 0) {
      clearLocalSelections();
      return;
    }

    this.studentServices.updateTakenCourses(idsToDelete, this.fullName).subscribe({
      next: () => {
        this.message.success(`${idsToDelete.length} unpaid course(s) removed successfully.`);
        clearLocalSelections();
      },
      error: () => {
        this.message.error('Failed to remove unpaid courses. Please try again.');
        this.updateSubmitButtonState();
      }
    });
  }


  // Update submit button state based on form validation
  updateSubmitButtonState(): void {
    const termSelected = this.formCourseOffered.get('termId')?.value !== null &&
      this.formCourseOffered.get('termId')?.value !== undefined;
    const yearSelected = this.formCourseOffered.get('termYear')?.value !== null &&
      this.formCourseOffered.get('termYear')?.value !== undefined;
    const hasNewSelections = this.getNewlySelectedCourses().length > 0;
    this.canSubmit = termSelected && yearSelected && hasNewSelections;
    this.canDelete = this.selectedRegisteredCourses.length > 0;
  }

  /** Courses checked on Available that are not already saved for the student. */
  getNewlySelectedCourses(): CourseBreakDownOffering[] {
    const result: CourseBreakDownOffering[] = [];
    for (const uniqueKey of this.selectedUnregisteredCourses) {
      const [courseId, batchCode] = uniqueKey.split('|');
      const normalizedId = (courseId || '').toLowerCase();
      let course = this.unregisteredCourses.find(c =>
        String(c.courseId).toLowerCase() === normalizedId &&
        (c.batchCode || '') === (batchCode || '')
      );
      if (!course) {
        course = this.unregisteredCourses.find(c => String(c.courseId).toLowerCase() === normalizedId);
      }
      if (!course) {
        continue;
      }

      // RA and RC retake: allow submit even if a previous Regular paid row exists.
      if (this.isRetakeGrade(course)) {
        result.push(course);
        continue;
      }

      // Only brand-new picks are submitted; unpaid existing stay selected but are not re-posted.
      if (!course.isPaid && !course.isRegistered && !this.isExistingUnpaidRegistration(course)) {
        result.push(course);
      }
    }
    return result;
  }

  // Delete selected registered courses
  deleteSelectedCourses(): void {
    if (this.selectedRegisteredCourses.length === 0) {
      return;
    }

    // Get selected course details
    const selectedCourseDetails = this.selectedRegisteredCourses.map(courseId => {
      return this.courseList.find(c => c.id === courseId);
    }).filter(course => course !== undefined);

    // Set up confirmation modal data
    this.confirmationModalData = {
      type: 'deletion',
      student: this.studentList,
      selectedCourses: selectedCourseDetails
    };

    // Show confirmation modal
    this.showConfirmationModal = true;
  }



  private performDeleteCourses(): void {
    const courseIds = this.selectedRegisteredCourses.map(id => id);
    this.studentServices.updateTakenCourses(courseIds, this.fullName).subscribe({
      next: (response) => {
        this.courseList = this.courseList.filter(course =>
          !this.selectedRegisteredCourses.includes(course.id)
        );
        this.filterRegisteredCourses();
        this.selectedRegisteredCourses = [];
        this.canDelete = false;
        this.message.success(`${courseIds.length} course(s) have been deleted successfully.`);
      },
      error: () => {
        this.message.error('Failed to delete selected courses. Please try again.');
      }
    });
  }

  // Submit the form
  onSubmit(): void {
    if (!this.canSubmit) {
      return;
    }

    const selectedCourseDetails = this.getNewlySelectedCourses();
    if (!selectedCourseDetails.length) {
      this.message.error('No new courses selected for registration.');
      return;
    }

    // Set up confirmation modal data
    this.confirmationModalData = {
      type: 'registration',
      student: this.studentList,
      selectedCourses: selectedCourseDetails,
      academicTerm: this.getTermDescription(this.formCourseOffered.get('termId')?.value),
      academicYear: this.formCourseOffered.get('termYear')?.value
    };

    // Show confirmation modal
    this.showConfirmationModal = true;
  }



  // Confirmation modal event handlers
  onConfirmationConfirmed(): void {
    if (this.confirmationModalData?.type === 'deletion') {
      this.performDeleteCourses();
    } else if (this.confirmationModalData?.type === 'registration') {
      this.performSubmitRegistration();
    }
    this.showConfirmationModal = false;
  }

  onConfirmationCancelled(): void {
    this.showConfirmationModal = false;
  }

  // Helper method to get term description
  private getTermDescription(termId: number): string {
    const term = this.listOfTerm.find(t => t.Id === termId);
    return term ? term.Description : 'Unknown Term';
  }

  private performSubmitRegistration(): void {
    const newlySelected = this.getNewlySelectedCourses();
    if (!newlySelected.length) {
      this.message.error('No new courses selected for registration.');
      return;
    }

    const selectedCourses: SelectedCourses[] = newlySelected.map(course => ({
      courseId: course.courseId,
      priority: 0,
      registrationStatus: RegistrationStatus.RegistrarOverride,
      totalAmount: course.totalAmount || 0,
      batchCode: course.batchCode || ''
    } as SelectedCourses));

    // Validate required fields
    if (!this.studentList || !this.studentList.id) {
      this.message.error('Student information is missing. Please search for a student first.');
      return;
    }

    const termId = this.formCourseOffered.get('termId')?.value;
    const termYear = this.formCourseOffered.get('termYear')?.value;

    if (!termId || !termYear) {
      this.message.error('Academic Term and Year are required.');
      return;
    }

    const request: SpecialCaseManualRegistrationRequest = {
      id: this.studentList.id,
      academicTermId: termId,
      year: termYear,
      batchCode: this.studentList.offerBatchCode || this.studentList.batchCode,
      createdBy: this.fullName,
      selectedCourses: selectedCourses
    };

    // Call the service method
    this.studentServices.addStudentManualCourseOfferingAsync(request).subscribe({
      next: (response) => {
        // Check if response is null or empty
        if (response === null || response === undefined) {
          // Still show success but log a warning
          this.message.warning('Registration request sent, but received empty response. Please verify the registration was successful.');
        } else {
          this.message.success('Course registration completed successfully.');
        }
        
        // Don't reset immediately - let user see the success
        setTimeout(() => {
          this.showSearchForm = true;
          if (this.studentSearchComponent) {
            this.studentSearchComponent.resetForm();
          }
          this.resetForm();
        }, 1500);
      },
      error: (error) => {
        // Provide more detailed error message
        let errorMessage = 'Failed to submit registration.';
        if (error?.error?.message) {
          errorMessage += ` ${error.error.message}`;
        } else if (error?.message) {
          errorMessage += ` ${error.message}`;
        } else if (error?.status) {
          errorMessage += ` (Status: ${error.status})`;
        }
        
        this.message.error(errorMessage);
      }
    });
  }

  getListOfAcademicTermStatus() {
    let division: StaticData = new StaticData();
    ACADEMIC_TERM_STATUS.forEach(pair => {
      division = {
        Id: pair.Id,
        Description: pair.Description
      };
      this.listOfTerm.push(division);
    });
  }

  getYearRange(currentYear: number): number[] {
    const startYear = 1998;
    const yearList = [];
    for (let year = startYear; year <= currentYear; year++) {
      yearList.push(year);
    }

    return yearList.reverse();
  }

  // Helper methods for template
  isRegisteredCourseSelected(courseId: number): boolean {
    return this.selectedRegisteredCourses.includes(courseId);
  }

  isUnregisteredCourseSelected(course: CourseBreakDownOffering): boolean {
    const uniqueKey = this.getCourseUniqueKey(course);
    if (this.selectedUnregisteredCourses.includes(uniqueKey)) {
      return true;
    }
    // Unpaid existing registrations are assumed selected until the user unselects them
    return this.isExistingUnpaidRegistration(course);
  }

  // Get count of selectable (non-disabled) courses
  getSelectableUnregisteredCoursesCount(): number {
    return this.filteredUnregisteredCourses.filter(course => !this.isUnregisteredCourseDisabled(course)).length;
  }

  // Check if all selectable courses are selected
  areAllSelectableUnregisteredCoursesSelected(): boolean {
    const selectableCourses = this.filteredUnregisteredCourses.filter(course => !this.isUnregisteredCourseDisabled(course));
    if (selectableCourses.length === 0) return false;
    // Group by courseId - we only need one selected per courseId
    const courseIdSet = new Set(selectableCourses.map(c => c.courseId));
    const selectedCourseIds = new Set(this.selectedUnregisteredCourses.map(key => key.split('|')[0]));
    return courseIdSet.size > 0 && courseIdSet.size === selectedCourseIds.size && 
           Array.from(courseIdSet).every(id => selectedCourseIds.has(id));
  }

  // Filter methods
  onRegisteredCoursesFilterChange(): void {
    this.filterRegisteredCourses();
  }

  onUnregisteredCoursesFilterChange(): void {
    this.filterUnregisteredCourses();
  }

  private filterRegisteredCourses(): void {
    if (!this.registeredCoursesFilter.trim()) {
      this.filteredRegisteredCourses = [...this.courseList];
    } else {
      const filterValue = this.registeredCoursesFilter.toLowerCase();
      this.filteredRegisteredCourses = this.courseList.filter(course =>
        course.courseCode?.toLowerCase().includes(filterValue) ||
        course.courseTitle?.toLowerCase().includes(filterValue) ||
        course.currentGrade?.toLowerCase().includes(filterValue) ||
        course.grade?.toLowerCase().includes(filterValue)
      );
    }
  }

  private filterUnregisteredCourses(): void {
    let filtered = [...this.unregisteredCourses];
    
    // Apply text filter
    if (this.unregisteredCoursesFilter.trim()) {
      const filterValue = this.unregisteredCoursesFilter.toLowerCase();
      filtered = filtered.filter(course =>
        course.courseCode?.toLowerCase().includes(filterValue) ||
        course.courseTitle?.toLowerCase().includes(filterValue)
      );
    }
    
    // Apply sorting
    if (this.sortColumn && this.sortOrder && (this.sortOrder === 'ascend' || this.sortOrder === 'descend')) {
      filtered = this.sortCourses(filtered, this.sortColumn, this.sortOrder);
    }
    
    this.filteredUnregisteredCourses = filtered;
  }

  // Sorting method
  sortUnregisteredCourses(column: string, order: string | null): void {
    this.sortColumn = column;
    this.sortOrder = order;
    this.filterUnregisteredCourses();
  }

  private sortCourses(courses: CourseBreakDownOffering[], column: string, order: string): CourseBreakDownOffering[] {
    const sorted = [...courses];
    
    sorted.sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (column) {
        case 'batchCode':
          aValue = (a.batchCode || '').toLowerCase();
          bValue = (b.batchCode || '').toLowerCase();
          break;
        case 'courseTitle':
          aValue = (a.courseTitle || '').toLowerCase();
          bValue = (b.courseTitle || '').toLowerCase();
          break;
        case 'currentGrade':
          aValue = (a.currentGrade || '').toLowerCase();
          bValue = (b.currentGrade || '').toLowerCase();
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) {
        return order === 'ascend' ? -1 : 1;
      }
      if (aValue > bValue) {
        return order === 'ascend' ? 1 : -1;
      }
      return 0;
    });
    
    return sorted;
  }

  // Update all courses for dropdown
  private updateAllCourses(): void {
    this.allCourses = [
      ...this.unregisteredCourses,
      ...this.courseList
    ];
  }

  // Filter function for course dropdown
  filterCourseOption = (input: string, option: any): boolean => {
    const courseCode = option.label.split(' - ')[0]?.toLowerCase() || '';
    const courseTitle = option.label.split(' - ')[1]?.toLowerCase() || '';
    const searchTerm = input.toLowerCase();

    return courseCode.includes(searchTerm) || courseTitle.includes(searchTerm);
  }

  // Get color for course status tag
  getCourseStatusColor(courseStatus: string): string {
    if (!courseStatus) {
      return 'blue';
    }

    switch (courseStatus.toLowerCase()) {
      case 'ra':
        return 'orange';
      case 'unregistered':
        return 'blue';
      case 'registered':
      case 'manual registration':
        return 'green';
      case 'regular':
        return 'blue';
      case 'taken':
        return 'purple';
      case 'dropped':
        return 'red';
      case 'exempted':
        return 'cyan';
      case 'inactive':
        return 'default';
      case 'has prerequisite':
        return 'volcano';
      case 'not taken':
        return 'blue';
      case 'unpaid':
        return 'gold';
      default:
        return 'default';
    }
  }
}
