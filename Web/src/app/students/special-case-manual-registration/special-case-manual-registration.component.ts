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



  // Course selection tracking
  selectedRegisteredCourses: number[] = [];
  selectedUnregisteredCourses: string[] = [];

  // Form validation states
  canSubmit = false;
  canDelete = false;

  // Filter properties
  registeredCoursesFilter: string = '';
  unregisteredCoursesFilter: string = '';
  filteredRegisteredCourses: CourseBreakDownOffering[] = [];
  filteredUnregisteredCourses: CourseBreakDownOffering[] = [];

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

    this.formCourseOffered.valueChanges.subscribe(() => {
      this.updateSubmitButtonState();
    });
  }

  onSearchSubmitted(studentId: string): void {
    this.selectedRegisteredCourses = [];
    this.selectedUnregisteredCourses = [];
    this.canDelete = false;
    this.canSubmit = false;
    this.studentServices.getCoursesNotOnStudentProfile(studentId).subscribe({
      next: (unregisteredCourses) => {
        this.unregisteredCourses = unregisteredCourses || [];
        this.filteredUnregisteredCourses = [...this.unregisteredCourses];
        this.getRegisteredCourses(studentId);
        this.updateAllCourses();
      },
      error: (error) => {
        this.unregisteredCourses = [];
        this.filteredUnregisteredCourses = [];
        this.getRegisteredCourses(studentId);
      }
    });
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
      },
      error: (error) => {
        console.error('Error fetching registered courses:', error);
        this.showSearchForm = false;
      }
    });
  }



  showSearch(): void {
    this.showSearchForm = true;
    this.studentSearchComponent.resetForm();
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

  // Handle unregistered course selection
  onUnregisteredCourseSelectionChange(courseId: string, checked: boolean): void {
    if (checked) {
      this.selectedUnregisteredCourses.push(courseId);
    } else {
      this.selectedUnregisteredCourses = this.selectedUnregisteredCourses.filter(id => id !== courseId);
    }
    this.updateSubmitButtonState();
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
      this.selectedUnregisteredCourses = this.filteredUnregisteredCourses.map(course => course.courseId);
    } else {
      this.selectedUnregisteredCourses = [];
    }
    this.updateSubmitButtonState();
  }

  // Handle HTML checkbox events
  onSelectAllRegisteredCoursesEvent(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.onSelectAllRegisteredCourses(target.checked);
  }

  onSelectAllUnregisteredCoursesEvent(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.onSelectAllUnregisteredCourses(target.checked);
  }

  onRegisteredCourseSelectionChangeEvent(courseId: number, event: Event): void {
    const target = event.target as HTMLInputElement;
    this.onRegisteredCourseSelectionChange(courseId, target.checked);
  }

  onUnregisteredCourseSelectionChangeEvent(courseId: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    this.onUnregisteredCourseSelectionChange(courseId, target.checked);
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
      error: (error) => {
        console.error('Error deleting courses:', error);
        this.message.error('Failed to delete selected courses. Please try again.');
      }
    });
  }

  // Submit the form
  onSubmit(): void {
    if (!this.canSubmit) {
      return;
    }

    // Get selected course details
    const selectedCourseDetails = this.selectedUnregisteredCourses.map(courseId => {
      return this.unregisteredCourses.find(c => c.courseId === courseId);
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
    const selectedCourses: SelectedCourses[] = this.selectedUnregisteredCourses.map(courseId => {
      const course = this.unregisteredCourses.find(c => c.courseId === courseId);
      return {
        courseId: courseId,
        priority: 0, 
        registrationStatus: 4, 
        totalAmount: course?.totalAmount || 0,
        batchCode: this.studentList.batchCode
      } as SelectedCourses;
    });

    const request: SpecialCaseManualRegistrationRequest = {
      id: this.studentList.id,
      academicTermId: this.formCourseOffered.get('termId')?.value,
      year: this.formCourseOffered.get('termYear')?.value,
      batchCode: this.studentList.batchCode,
      createdBy: this.fullName,
      selectedCourses: selectedCourses
    };

    console.log('Submitting registration request:', request);

    // Call the service method
    this.studentServices.addStudentManualCourseOfferingAsync(request).subscribe({
      next: (response) => {
        console.log('Registration submitted successfully:', response);
        this.message.success('Course registration completed successfully.');
        this.resetForm();
      },
      error: (error) => {
        console.error('Error submitting registration:', error);
        this.message.error('Failed to submit registration. Please try again.');
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

  isUnregisteredCourseSelected(courseId: string): boolean {
    return this.selectedUnregisteredCourses.includes(courseId);
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
    if (!this.unregisteredCoursesFilter.trim()) {
      this.filteredUnregisteredCourses = [...this.unregisteredCourses];
    } else {
      const filterValue = this.unregisteredCoursesFilter.toLowerCase();
      this.filteredUnregisteredCourses = this.unregisteredCourses.filter(course =>
        course.courseCode?.toLowerCase().includes(filterValue) ||
        course.courseTitle?.toLowerCase().includes(filterValue)
      );
    }
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
}
