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
          // Auto-select courses that are already registered
          this.autoSelectRegisteredCourses();
          this.filterUnregisteredCourses(); // Use filter method which applies sorting
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
    return `${course.courseId}|${course.batchCode || ''}`;
  }

  // Handle unregistered course selection
  onUnregisteredCourseSelectionChange(course: CourseBreakDownOffering, checked: boolean): void {
    // Prevent selecting paid courses
    if (checked && course.isPaid === true) {
      this.message.warning('This course is already paid and cannot be selected.');
      return;
    }

    const uniqueKey = this.getCourseUniqueKey(course);
    if (checked) {
      // Remove any other courses with the same courseId but different batchCode
      this.selectedUnregisteredCourses = this.selectedUnregisteredCourses.filter(key => {
        const [existingCourseId] = key.split('|');
        return existingCourseId !== course.courseId;
      });
      // Add the newly selected course
      this.selectedUnregisteredCourses.push(uniqueKey);
    } else {
      // Don't allow deselecting registered courses
      if (course.isRegistered === true) {
        this.message.warning('This course is already registered and cannot be deselected.');
        return;
      }
      this.selectedUnregisteredCourses = this.selectedUnregisteredCourses.filter(key => key !== uniqueKey);
    }
    this.updateSubmitButtonState();
  }

  // Check if a course should be disabled (same courseId but different batchCode is selected, or if isPaid is true)
  isUnregisteredCourseDisabled(course: CourseBreakDownOffering): boolean {
    // If course is paid, it should be disabled (cannot be selected or deselected)
    if (course.isPaid === true) {
      return true;
    }

    // If course is registered, it should be selected but the checkbox should be disabled for deselection
    // However, we allow it to be checked, so we only disable if it's not selected
    if (course.isRegistered === true) {
      const currentCourseKey = this.getCourseUniqueKey(course);
      // If it's registered and selected, don't disable (so it shows as checked)
      // If it's registered but not selected, disable it (shouldn't happen, but just in case)
      return !this.selectedUnregisteredCourses.includes(currentCourseKey);
    }

    const currentCourseKey = this.getCourseUniqueKey(course);
    
    // If this course is already selected, don't disable it
    if (this.selectedUnregisteredCourses.includes(currentCourseKey)) {
      return false;
    }

    // Check if there's a selected course with the same courseId but different batchCode
    for (const selectedKey of this.selectedUnregisteredCourses) {
      const [selectedCourseId] = selectedKey.split('|');
      if (selectedCourseId === course.courseId) {
        // Same courseId is selected, but with different batchCode (since currentCourseKey is not in selected)
        return true; // Disable this course
      }
    }
    return false;
  }

  // Auto-select courses that are already registered
  private autoSelectRegisteredCourses(): void {
    for (const course of this.unregisteredCourses) {
      if (course.isRegistered === true) {
        const uniqueKey = this.getCourseUniqueKey(course);
        // Only add if not already selected
        if (!this.selectedUnregisteredCourses.includes(uniqueKey)) {
          // Remove any other courses with the same courseId but different batchCode
          this.selectedUnregisteredCourses = this.selectedUnregisteredCourses.filter(key => {
            const [existingCourseId] = key.split('|');
            return existingCourseId !== course.courseId;
          });
          // Add the registered course
          this.selectedUnregisteredCourses.push(uniqueKey);
        }
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
      // Only select courses that are not disabled
      // Group by courseId and only select one per courseId
      const courseIdMap = new Map<string, CourseBreakDownOffering>();
      this.filteredUnregisteredCourses
        .filter(course => !this.isUnregisteredCourseDisabled(course))
        .forEach(course => {
          // If we haven't seen this courseId yet, or if we want to prefer a specific batchCode
          if (!courseIdMap.has(course.courseId)) {
            courseIdMap.set(course.courseId, course);
          }
        });
      
      // Get all selectable courses
      const selectableKeys = Array.from(courseIdMap.values())
        .map(course => this.getCourseUniqueKey(course));
      
      // Add to existing selections (don't replace, in case some are already selected)
      selectableKeys.forEach(key => {
        if (!this.selectedUnregisteredCourses.includes(key)) {
          // Remove any other courses with the same courseId
          const [courseId] = key.split('|');
          this.selectedUnregisteredCourses = this.selectedUnregisteredCourses.filter(existingKey => {
            const [existingCourseId] = existingKey.split('|');
            return existingCourseId !== courseId;
          });
          this.selectedUnregisteredCourses.push(key);
        }
      });
    } else {
      // Only deselect courses that are not registered (keep registered courses selected)
      this.selectedUnregisteredCourses = this.selectedUnregisteredCourses.filter(key => {
        const [courseId, batchCode] = key.split('|');
        const course = this.unregisteredCourses.find(c => 
          c.courseId === courseId && (c.batchCode || '') === (batchCode || '')
        );
        // Keep it selected if it's registered
        return course?.isRegistered === true;
      });
    }
    this.updateSubmitButtonState();
  }


  // Update submit button state based on form validation
  updateSubmitButtonState(): void {
    const termSelected = this.formCourseOffered.get('termId')?.value !== null &&
      this.formCourseOffered.get('termId')?.value !== undefined;
    const yearSelected = this.formCourseOffered.get('termYear')?.value !== null &&
      this.formCourseOffered.get('termYear')?.value !== undefined;
    const hasUnregisteredSelections = this.selectedUnregisteredCourses.length > 0;
    this.canSubmit = termSelected && yearSelected && hasUnregisteredSelections;
    this.canDelete = this.selectedRegisteredCourses.length > 0;
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

    // Get selected course details using unique keys
    const selectedCourseDetails = this.selectedUnregisteredCourses.map(uniqueKey => {
      const [courseId, batchCode] = uniqueKey.split('|');
      return this.unregisteredCourses.find(c => c.courseId === courseId && c.batchCode === batchCode);
    }).filter(course => course !== undefined);

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
    // Validate that we have selected courses
    if (!this.selectedUnregisteredCourses || this.selectedUnregisteredCourses.length === 0) {
      this.message.error('No courses selected for registration.');
      return;
    }

    // Build selected courses array with proper validation
    const selectedCourses: SelectedCourses[] = [];
    for (const uniqueKey of this.selectedUnregisteredCourses) {
      const [courseId, batchCode] = uniqueKey.split('|');
      
      // Find the course - try with batchCode match first, then fallback to just courseId
      let course = this.unregisteredCourses.find(c => 
        c.courseId === courseId && 
        (c.batchCode || '') === (batchCode || '')
      );
      
      // If not found with batchCode, try without batchCode match (for backward compatibility)
      if (!course) {
        course = this.unregisteredCourses.find(c => c.courseId === courseId);
      }
      
      if (!course) {
        this.message.error(`Course not found: ${courseId}. Please refresh and try again.`);
        return;
      }
      
      selectedCourses.push({
        courseId: courseId,
        priority: 0,
        registrationStatus: 4,
        totalAmount: course.totalAmount || 0,
        batchCode: course.batchCode || batchCode || ''
      } as SelectedCourses);
    }

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
      batchCode: this.studentList.batchCode,
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
    return this.selectedUnregisteredCourses.includes(uniqueKey);
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
        course.courseTitle?.toLowerCase().includes(filterValue)
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
      return 'blue'; // Default color for available courses
    }

    switch (courseStatus.toLowerCase()) {
      case 'ra':
        return 'orange';
      case 'unregistered':
        return 'blue';
      case 'registered':
        return 'green';
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
      default:
        return 'default';
    }
  }
}
