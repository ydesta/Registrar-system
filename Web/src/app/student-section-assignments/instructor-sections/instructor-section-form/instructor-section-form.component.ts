import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InstructorSectionModel, InstructorSectionRequest } from '../../../Models/InstructorSectionModel';
import { AuthService } from '../../../services/auth.service';
import { InstructorSectionService } from '../../../services/instructor-section.service';
import { CustomNotificationService } from '../../../services/custom-notification.service';
import { StaffService } from 'src/app/services/staff.service';
import { StudentSectionAssignmentService } from 'src/app/services/student-section-assignment.service';
import { SectionViewModel } from 'src/app/Models/SectionViewModel';
import { StaticData } from 'src/app/admission-request/model/StaticData';
import { TermCourseOfferingService } from 'src/app/colleges/services/term-course-offering.service';
import { ACADEMIC_TERM_STATUS, SECTION_TYPE } from 'src/app/common/constant';
import { StudentRegisteredCoursesModel, StudentRegisteredCoursesResult } from 'src/app/Models/StudentRegisteredCoursesModel';
import { CourseOfferingInstructorAssignmentService } from 'src/app/colleges/services/course-offering-instructor-assignment.service';
import { StaffModel } from 'src/app/Models/StaffModel';

@Component({
  selector: 'app-instructor-section-form',
  templateUrl: './instructor-section-form.component.html',
  styleUrls: ['./instructor-section-form.component.scss']
})
export class InstructorSectionFormComponent implements OnInit {
  @Output() formSubmit = new EventEmitter<InstructorSectionRequest>();
  @Output() formCancel = new EventEmitter<void>();

  form!: FormGroup;
  yearList: number[] = [];

  isEditMode = false;
  editingId: number | null = null;
  loading = false;
  listOfSections: SectionViewModel[] = [];
  availableSections: SectionViewModel[] = [];
  loadingSections = false;
  loadingCourses = false;
  errorMessage = '';
  successMessage = '';
  listOfTermNumber: StaticData[] = [];
  listOfSectionType: StaticData[] = [];
  listOfBatch: any[] = [];
  registeredCourses: StudentRegisteredCoursesModel[] = [];
  staffList: StaffModel[] = [];
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private instructorSectionService: InstructorSectionService,
    private studentSectionAssignmentService: StudentSectionAssignmentService,
    private notificationService: CustomNotificationService,
    private courseTermOfferingService: TermCourseOfferingService,
    private courseOfferingInstructorAssignmentService: CourseOfferingInstructorAssignmentService,
  ) {
    const currentYear = new Date().getFullYear();
    this.yearList = this.getYearRange(currentYear);
    this.createForm();
  }

  ngOnInit(): void {
    this.checkEditMode();
    this.getListOfAcademicTermStatus();
    this.getListOfSectionType();
    
    // Load batch list when both academic term and year are selected
    this.academicTerm.valueChanges.subscribe(res => {
      if (res && this.year.value) {
        this.getListOfBatch(res, this.year.value);
      } else {
        // Clear batch list if either field is missing
        this.listOfBatch = [];
        this.form.patchValue({ batchId: null });
      }
    });

    this.year.valueChanges.subscribe(year => {
      if (year && this.academicTerm.value) {
        this.getListOfBatch(this.academicTerm.value, year);
      } else {
        // Clear batch list if either field is missing
        this.listOfBatch = [];
        this.form.patchValue({ batchId: null });
      }
    });

    // Load courses and sections when section type changes (if all required fields are selected)
    this.sectionType.valueChanges.subscribe(sectionType => {
      const batch = this.listOfBatch.find(b => b.Id === this.batchId.value) ||
        this.listOfBatch.find(b => b.id === this.batchId.value) ||
        this.listOfBatch.find(b => b.batchId === this.batchId.value);

      const batchCode = batch?.batchCode || batch?.batchCode || batch?.code || '';

      if (this.academicTerm.value && this.year.value && this.batchId.value) {
        this.loadAvailableSections(batchCode);
        this.getListOfCourse(batchCode);
      } else {
        // Clear courses and sections if section type is not selected
        this.registeredCourses = [];
        this.listOfSections = [];
        this.form.patchValue({ courseId: null, sectionId: null });
      }
    });

    this.courseId.valueChanges.subscribe(course => {
      if (course && this.academicTerm.value && this.year.value && this.batchId.value) {
        this.loadAvailableStaff();
      }
    });
  }

  // Method to manually check form validity
  checkFormValidity(): void {
    // Form validation check completed
  }
  checkEditMode(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.editingId = +params['id'];
        this.isEditMode = true;
        this.loadInstructorSection(this.editingId);
      }
    });
  }
  getListOfSectionType() {
    let division: StaticData = new StaticData();
    SECTION_TYPE.forEach(pair => {
      division = {
        Id: pair.Id,
        Description: pair.Description
      };
      this.listOfSectionType.push(division);
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
  loadAvailableStaff(): void {
    // Validate all required parameters before making API call
    if (!this.batchId.value || !this.academicTerm.value || !this.year.value || !this.courseId.value) {
      return;
    }
    
    this.courseOfferingInstructorAssignmentService.getAssignedInstructors(this.academicTerm.value, this.year.value, this.batchId.value, this.courseId.value).subscribe({
      next: (res: any) => {
        this.staffList = res || [];
      },
      error: (error) => {
        this.notificationService.notification('error', 'Error', 'Failed to load assigned instructors');
      }
    });
  }

  private loadDependentData(data: InstructorSectionModel): void {
    // Only load dependent data if we have all required fields
    if (!data.academicTerm || !data.year || !data.batchId) {
      return;
    }

    // Load batch list first
    this.getListOfBatch(data.academicTerm, data.year);
    
    // Load sections and courses after batch is loaded
    setTimeout(() => {
      if (this.listOfBatch.length > 0) {
        const batch = this.listOfBatch.find(b => b.batchId === data.batchId) ||
                     this.listOfBatch.find(b => b.Id === data.batchId) ||
                     this.listOfBatch.find(b => b.id === data.batchId);
        
        if (batch) {
          const batchCode = batch.batchCode || batch.code || '';
          
          // Only make API calls if we have valid batchCode and form is populated
          if (batchCode && batchCode.trim() !== '' && this.form.value.batchId) {
            // Double-check that form values are properly set
            if (this.form.value.academicTerm && this.form.value.year && this.form.value.batchId) {
              this.loadAvailableSections(batchCode);
              this.getListOfCourse(batchCode);
              
              // Load staff list after courses are loaded
              setTimeout(() => {
                if (data.courseId && this.form.value.courseId) {
                  this.loadAvailableStaff();
                }
              }, 600);
            }
          }
        }
      }
    }, 300);
  }
  loadAvailableSections(batchCode: string): void {
    // Validate all required parameters before making API call
    if (!this.batchId.value || !this.academicTerm.value || !this.year.value || !batchCode || batchCode.trim() === '') {
      return;
    }
    
    this.loadingSections = true;
    this.availableSections = [];
    this.listOfSections = [];

    this.studentSectionAssignmentService
      .getListOfSectionBasedOnBatch(batchCode, this.academicTerm.value, this.year.value, this.sectionType.value)
      .subscribe({
        next: (sections: any) => {
          this.loadingSections = false;
          this.availableSections = sections.data || [];
          this.listOfSections = sections.data;
        },
        error: (error) => {
          this.loadingSections = false;
          this.notificationService.notification('error', 'Error', 'Failed to load available sections');
        }
      });
  }
  getListOfCourse(batchCode: string) {
    // Validate all required parameters before making API call
    if (!this.batchId.value || !this.academicTerm.value || !this.year.value || !batchCode || batchCode.trim() === '') {
      return;
    }
    
    this.loadingCourses = true;
    this.registeredCourses = [];

    const academicTerm = this.academicTerm.value;
    const year = this.year.value;
    const sectionType = this.sectionType.value;
    this.studentSectionAssignmentService
      .getStudentRegisteredCourses(batchCode, academicTerm, year,sectionType)
      .subscribe({
        next: (res: StudentRegisteredCoursesResult) => {
          this.loadingCourses = false;
          this.registeredCourses = res.courses || [];
        },
        error: (error) => {
          this.loadingCourses = false;
          this.notificationService.notification('error', 'Error', 'Failed to load registered courses');
        }
      });
  }
  getListOfBatch(termId: number = 0, termYear: number = 0) {
    // Validate parameters before making API call
    if (!termId || !termYear) {
      return;
    }
    
    this.courseTermOfferingService.getListOfBatchCodeByAcademicTerm(termId, termYear).subscribe({
      next: (res) => {
        this.listOfBatch = res;
      },
      error: (error) => {
        // Handle error silently or add user notification if needed
      }
    });
  }
  loadInstructorSection(id: number): void {
    this.loading = true;
    this.instructorSectionService.getInstructorSectionById(id).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          // Wait for section types to be loaded before populating form
          if (this.listOfSectionType.length === 0) {
            // If section types not loaded yet, wait a bit and try again
            setTimeout(() => {
              this.populateForm(response.data);
              // Wait for form to be populated before loading dependent data
              setTimeout(() => {
                this.loadDependentData(response.data);
              }, 100);
            }, 200);
          } else {
            // Populate form immediately if section types are loaded
            this.populateForm(response.data);
            // Wait for form to be populated before loading dependent data
            setTimeout(() => {
              this.loadDependentData(response.data);
            }, 100);
          }
        } else {
          this.notificationService.showError('Failed to load instructor section');
        }
        this.loading = false;
      },
      error: (error) => {
        this.notificationService.showError('Error loading instructor section');
        this.loading = false;
      }
    });
  }

  createForm(): void {
    this.form = this.fb.group({
      academicTerm: [null, [Validators.required]],
      year: [null, [Validators.required]],
      batchId: [null, [Validators.required]],
      sectionType: [null, [Validators.required]],
      sectionId: [null, [Validators.required]],
      courseId: [null, [Validators.required]],
      staffId: [null, [Validators.required]]
    });
  }

  get academicTerm() {
    return this.form.get("academicTerm");
  }

  get year() {
    return this.form.get("year");
  }
  get sectionType() {
    return this.form.get("sectionType");
  }

  get courseId() {
    return this.form.get("courseId");
  }
  get batchId() {
    return this.form.get("batchId");
  }

  get sectionId() {
    return this.form.get("sectionId");
  }

  get staffId() {
    return this.form.get("staffId");
  }
  getYearRange(currentYear: number): number[] {
    const startYear = 1998;
    const yearList = [];
    for (let year = startYear; year <= currentYear; year++) {
      yearList.push(year);
    }
    return yearList.reverse();
  }

  populateForm(data: InstructorSectionModel): void {
    if (data) {
      this.form.patchValue({
        staffId: data.staffId,
        sectionId: data.sectionId,
        academicTerm: data.academicTerm,
        year: data.year,
        courseId: data.courseId,
        batchId: data.batchId,
        sectionType: data.sectionType
      });
    }
  }

  resetForm(): void {
    this.form.reset();
  }

  handleSubmit(): void {
    if (this.form.valid) {
      const formData = this.form.value;
      
      const currentUser = this.authService.getCurrentUser();
      const request: InstructorSectionRequest = {
        ...formData,
        createdBy: currentUser?.id || 'unknown-user',
        lastModifiedBy: currentUser?.id || 'unknown-user'
      };
      
      if (this.isEditMode && this.editingId) {
        this.updateInstructorSection(this.editingId, request);
      } else {
        this.createInstructorSection(request);
      }
    } else {
      Object.values(this.form.controls).forEach(control => {
        if (control.invalid) {
          control.markAsTouched();
        }
      });
    }
  }

  createInstructorSection(request: InstructorSectionRequest): void {
    this.loading = true;
    this.instructorSectionService.createInstructorSection(request).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.notificationService.showSuccess('Instructor section created successfully');
          this.router.navigate(['/student-section/instructor-sections']);
        } else {
          this.notificationService.showError('Failed to create instructor section');
        }
        this.loading = false;
      },
      error: (error) => {
        this.notificationService.showError('Error creating instructor section');
        this.loading = false;
      }
    });
  }

  updateInstructorSection(id: number, request: InstructorSectionRequest): void {
    this.loading = true;
    
    this.instructorSectionService.updateInstructorSection(id, request).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.notificationService.showSuccess('Instructor section updated successfully');
          this.router.navigate(['/student-section/instructor-sections']);
        } else {
          this.notificationService.showError('Failed to update instructor section');
        }
        this.loading = false;
      },
      error: (error) => {
        this.notificationService.showError('Error updating instructor section');
        this.loading = false;
      }
    });
  }

  handleCancel(): void {
    this.router.navigate(['/student-section/instructor-sections']);
  }

  getPageTitle(): string {
    return this.isEditMode ? 'Edit Instructor Section' : 'Add Instructor Section';
  }

  // Check if form is valid for submission
  isFormValid(): boolean {
    const formValid = this.form.valid;
    const academicTermValid = this.academicTerm.value !== null && this.academicTerm.value !== undefined;
    const yearValid = this.year.value !== null && this.year.value !== undefined;
    const batchIdValid = this.batchId.value !== null && this.batchId.value !== undefined;
    const sectionTypeValid = this.sectionType.value !== null && this.sectionType.value !== undefined;
    const sectionIdValid = this.sectionId.value !== null && this.sectionId.value !== undefined;
    const courseIdValid = this.courseId.value !== null && this.courseId.value !== undefined;
    const staffIdValid = this.staffId.value !== null && this.staffId.value !== undefined;

    return formValid && 
           academicTermValid && 
           yearValid && 
           batchIdValid && 
           sectionTypeValid && 
           sectionIdValid && 
           courseIdValid && 
           staffIdValid;
  }

  // Get submit button text
  getSubmitButtonText(): string {
    return this.isEditMode ? 'Update Instructor Section' : 'Create Instructor Section';
  }
}
