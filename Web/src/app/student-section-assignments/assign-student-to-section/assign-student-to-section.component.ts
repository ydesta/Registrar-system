import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { StudentSectionAssignmentService } from '../../services/student-section-assignment.service';
import { CustomNotificationService } from '../../services/custom-notification.service';
import { TermCourseOfferingService } from 'src/app/colleges/services/term-course-offering.service';
import { StudentRegisteredCoursesResult, StudentRegisteredCoursesModel, CourseInfo } from 'src/app/Models/StudentRegisteredCoursesModel';
import { SectionViewModel } from 'src/app/Models/SectionViewModel';
import { StudentProfileViewModel } from 'src/app/students/models/student-profile-view-model.model';
import { StudentInfo } from 'src/app/Models/StudentInfo';

@Component({
  selector: 'app-assign-student-to-section',
  templateUrl: './assign-student-to-section.component.html',
  styleUrls: ['./assign-student-to-section.component.scss']
})
export class AssignStudentToSectionComponent implements OnInit, OnDestroy {
  @Input() student!: StudentInfo;
  @Input() academicTerm!: number;
  @Input() year!: number;
  @Input() sectionType!: number;

  @Output() assignmentComplete = new EventEmitter<void>();
  @Output() assignmentCancelled = new EventEmitter<void>();

  private destroy$ = new Subject<void>();

  // Parameters
  studentId: string | null = null;
  batchCode: string | null = null;

  // Form and data
  searchForm: FormGroup;
  loading: boolean = false;
  loadingStudent: boolean = false;
  loadingCourses: boolean = false;
  loadingSections: boolean = false;

  // Student info
  studentInfo: StudentProfileViewModel | null = null;

  // Course data
  courses: CourseInfo[] = [];
  sectionsMap: { [courseId: string]: SectionViewModel[] } = {};
  allSections: SectionViewModel[] = [];

  // Validation
  isFormValid: boolean = false;
  showSummary: boolean = false;

  constructor(
    private fb: FormBuilder,
    private sectionService: StudentSectionAssignmentService,
    private notificationService: CustomNotificationService,
    private courseTermOfferingService: TermCourseOfferingService
  ) {
    this.createSearchForm();
  }

  ngOnInit(): void {
    if (this.student && this.academicTerm && this.year) {
      this.studentId = this.student.id;
      this.batchCode = this.student.batchCode;
      this.loadStudentInfo();
      this.loadStudentCourses();
      this.loadSectionsForBatch();
    } else {
      this.notificationService.notification(
        'error',
        'Invalid Parameters',
        'Missing required parameters.'
      );
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createSearchForm(): void {
    this.searchForm = this.fb.group({
      courseAssignments: this.fb.array([])
    });
  }

  // Getters
  get courseAssignmentsFormArray() {
    return this.searchForm.get('courseAssignments') as FormArray;
  }

  private loadStudentInfo(): void {
    if (!this.studentId || !this.academicTerm || !this.year) return;

    this.loadingStudent = true;
    this.sectionService.getStudentSectioningByStudentId(this.studentId, this.academicTerm, this.year)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loadingStudent = false;
          if (response) {
            this.studentInfo = response;
          }
        },
        error: () => {
          this.loadingStudent = false;
          this.notificationService.notification('error', 'Error', 'Failed to load student information');
        }
      });
  }

  private loadStudentCourses(): void {
    if (!this.batchCode || !this.academicTerm || !this.year || !this.studentId) return;
    this.loadingCourses = true;
    this.courses = [];

    this.sectionService.getUnassignedCoursesForStudent(this.studentId, this.academicTerm, this.year, this.batchCode, this.sectionType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.loadingCourses = false;
          // Handle both direct array and wrapped response
          const courses: CourseInfo[] = Array.isArray(response) ? response : (response?.data || response?.courses || []);

          if (courses && courses.length > 0) {
            this.courses = courses;
            this.buildFormArray();
          }
        },
        error: () => {
          this.loadingCourses = false;
          this.notificationService.notification('error', 'Error', 'Failed to load courses');
        }
      });
  }

  private buildFormArray(): void {
    const formArray = this.courseAssignmentsFormArray;
    formArray.clear();

    this.courses.forEach(course => {
      const courseGroup = this.fb.group({
        courseId: [course.courseId, Validators.required],
        courseCode: [course.courseCode],
        courseTitle: [course.courseTitle],
        batchCode: [course.batchCode, Validators.required],
        sectionId: [null, Validators.required]
      });

      formArray.push(courseGroup);
    });

  }

  private loadSectionsForBatch(): void {
    if (!this.batchCode || !this.academicTerm || !this.year) return;

    this.loadingSections = true;
    this.sectionService.getListOfSectionAssignedBatch(this.batchCode, this.academicTerm, this.year, this.sectionType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.loadingSections = false;
          if (response) {

            // Handle different response formats
            let sectionsData: any[] = [];

            if (Array.isArray(response)) {
              sectionsData = response;
            } else if (response.data && Array.isArray(response.data)) {
              sectionsData = response.data;
            } else if (response.sections && Array.isArray(response.sections)) {
              sectionsData = response.sections;
            } else if (Array.isArray(response)) {
              sectionsData = response;
            }


            // Map to SectionViewModel format
            this.allSections = sectionsData.map((item: any) => ({
              id: item.id || item.sectionId || item.Id || 0,
              sectionName: item.sectionName || item.name || item.SectionName || item.title || 'Section'
            }));

          } else {
            this.allSections = [];
          }
        },
        error: (error) => {
          this.loadingSections = false;
          this.allSections = [];
          this.notificationService.notification('error', 'Error', 'Failed to load sections');
        }
      });
  }

  getSectionsForCourse(): SectionViewModel[] {
    return this.allSections;
  }

  validateForm(): boolean {
    // Mark all form controls as touched to show validation errors
    this.courseAssignmentsFormArray.controls.forEach(control => {
      control.markAllAsTouched();
    });

    // Check if form is valid
    this.isFormValid = this.searchForm.valid;
    
    // Additional validation: Check if batchCode is present for all courses
    const hasEmptyBatchCode = this.courseAssignmentsFormArray.controls.some(control => 
      !control.get('batchCode')?.value
    );
    
    if (hasEmptyBatchCode) {
      return false;
    }
    
    return this.isFormValid;
  }

  onSubmit(): void {
    if (!this.validateForm()) {
      // Check for missing sections
      const missingSections = this.courseAssignmentsFormArray.controls.filter(
        control => !control.get('sectionId')?.value
      ).length;
      
      // Check for missing batchCode
      const missingBatchCode = this.courseAssignmentsFormArray.controls.filter(
        control => !control.get('batchCode')?.value
      ).length;

      let errorMessage = '';
      if (missingSections > 0) {
        errorMessage = `Please select sections for ${missingSections} course(s).`;
      }
      if (missingBatchCode > 0) {
        errorMessage += ` Missing batch code for ${missingBatchCode} course(s).`;
      }

      this.notificationService.notification(
        'error',
        'Validation Error',
        errorMessage || 'Please complete all required fields.'
      );
      return;
    }

    this.loading = true;
    const assignments = this.prepareStudentSectionAssignments();
    
    // Send the array of assignments in a single request
    this.sectionService.addStudentSectionAssignment(assignments)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading = false;
          
          this.showSummary = true;
          this.notificationService.notification('success', 'Success', 'Student assigned to sections successfully');
          setTimeout(() => {
            this.assignmentComplete.emit();
          }, 1500);
        },
        error: (error) => {
          this.loading = false;
          this.notificationService.notification('error', 'Error', 'Failed to assign student to sections. Please try again.');
        }
      });
  }

  private prepareStudentSectionAssignments(): any[] {
    return this.courseAssignmentsFormArray.controls.map(control => {
      const formValue = control.value;

      // Validate all mandatory fields
      if (!this.studentId) {
      }
      if (!formValue.sectionId) {
      }
      if (!formValue.courseId) {
      }
      if (!formValue.batchCode) {
      }
      if (!this.sectionType) {
      }
      if (!this.academicTerm) {
      }
      if (!this.year) {
      }

      return {
        studentId: this.studentId,
        sectionId: formValue.sectionId,
        courseId: formValue.courseId,
        batchCode: formValue.batchCode,
        sectionType: this.sectionType,
        studentOfferedBatchCode: this.batchCode,
        academicTerm: this.academicTerm,
        year: this.year
      };
    });
  }

  onCancel(): void {
    this.assignmentCancelled.emit();
  }


  getStudentDisplayName(): string {
    return this.studentInfo?.fullName || 'Unknown Student';
  }

  getStudentCode(): string {
    return this.studentInfo?.studentCode || 'N/A';
  }

  getTotalCourses(): number {
    return this.courses.length;
  }

  getAssignedCoursesCount(): number {
    return this.courseAssignmentsFormArray.controls.filter(control => control.get('sectionId')?.value).length;
  }

  getStatusColor(status: string | undefined): string {
    if (!status) return 'default';

    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('active') || lowerStatus.includes('registered') || lowerStatus.includes('approved')) {
      return 'green';
    } else if (lowerStatus.includes('pending') || lowerStatus.includes('waiting')) {
      return 'orange';
    } else if (lowerStatus.includes('rejected') || lowerStatus.includes('cancelled') || lowerStatus.includes('inactive')) {
      return 'red';
    }
    return 'blue';
  }
}
