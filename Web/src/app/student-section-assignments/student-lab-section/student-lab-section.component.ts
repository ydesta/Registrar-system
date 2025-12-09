import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LabSectionAssignedStudentInfo, LabSectionAssignedStudentsResponse } from '../../Models/LabSectionAssignedStudentModel';
import { CustomNotificationService } from '../../services/custom-notification.service';
import { ACADEMIC_TERM_STATUS } from '../../common/constant';
import { TermCourseOfferingService } from '../../colleges/services/term-course-offering.service';
import { StaticData } from '../../admission-request/model/StaticData';
import { StudentSectionAssignmentService } from '../../services/student-section-assignment.service';
import { LabSectionAssignmentRequest } from '../../Models/BulkSectionAssignmentRequest';
import { NzModalService } from 'ng-zorro-antd/modal';
import { SectionViewModel } from 'src/app/Models/SectionViewModel';

@Component({
  selector: 'app-student-lab-section',
  templateUrl: './student-lab-section.component.html',
  styleUrls: ['./student-lab-section.component.scss']
})
export class StudentLabSectionComponent implements OnInit {
  // Make Math available in template
  Math = Math;

  // Form data
  searchForm: FormGroup;
  listOfTermNumber: StaticData[] = [];
  yearList: number[] = [];
  listOfBatch: any[] = [];

  // Component data
  labSectionAssignedStudents: LabSectionAssignedStudentInfo[] = [];
  loading = false;
  generatingAssignments = false;
  numberOfSections = 1; // Default value
  studentsPerSection = 45; // Calculated value
  errorMessage = '';
  successMessage = '';

  // Section generation status
  numberOfGeneratedSections: number = 0;
  isSectionGenerated: boolean = false;

  // Table configuration
  listOfData: LabSectionAssignedStudentInfo[] = [];
  listOfDisplayData: LabSectionAssignedStudentInfo[] = [];
  searchValue = '';

  // Collapse state
  isSearchCollapsed = false;
  listOfSections: SectionViewModel[] = [];
  availableSections: SectionViewModel[] = [];
  loadingSections = false;
  constructor(
    private fb: FormBuilder,
    private studentSectionAssignmentService: StudentSectionAssignmentService,
    private notificationService: CustomNotificationService,
    private courseTermOfferingService: TermCourseOfferingService,
    private modalService: NzModalService
  ) {
    const currentYear = new Date().getFullYear();
    this.yearList = this.getYearRange(currentYear);
    this.getListOfAcademicTermStatus();
    this.createSearchForm();
  }

  ngOnInit(): void {
    // Subscribe to academicTerm changes
    this.academicTerm.valueChanges.subscribe(term => {
      if (term && this.year.value) {
        this.getListOfBatch(term, this.year.value);
      } else {
        // Clear batch list and selection when term is cleared
        this.listOfBatch = [];
        this.batchCode.setValue(null);
      }
    });

    // Subscribe to year changes
    this.year.valueChanges.subscribe(year => {
      if (year && this.academicTerm.value) {
        this.getListOfBatch(this.academicTerm.value, year);
      } else {
        // Clear batch list and selection when year is cleared
        this.listOfBatch = [];
        this.batchCode.setValue(null);
      }
    });

    // Subscribe to batchCode changes to automatically search
    this.batchCode.valueChanges.subscribe(batchCode => {
      if (batchCode) {
        //  this.onSearch(batchCode);
        this.loadAvailableSections();
      }
    });
    this.sectionId.valueChanges.subscribe(section => {
      if (section && this.batchCode.value) {
        this.onSearch(this.batchCode.value, section);
      }
    });
  }

  // Form getters
  get academicTerm() { return this.searchForm.get('academicTerm'); }
  get year() { return this.searchForm.get('year'); }
  get batchCode() { return this.searchForm.get('batchCode'); }
  get sectionId() { return this.searchForm.get('sectionId'); }

  createSearchForm(): void {
    this.searchForm = this.fb.group({
      academicTerm: [null, Validators.required],
      year: [null, Validators.required],
      batchCode: [null, Validators.required],
      sectionId: [null, Validators.required]
    });
  }
  loadAvailableSections(): void {
    if (!this.batchCode.value || !this.academicTerm.value || !this.year.value) {
      return;
    }
    this.loadingSections = true;
    this.availableSections = [];
    this.listOfSections = [];
    const courseId = '00000000-0000-0000-0000-000000000000';
    const sectionType: number = 0; // Lab sections
    this.studentSectionAssignmentService
      .getListOfSectionBasedOnBatch(this.batchCode.value, this.academicTerm.value, this.year.value, sectionType, courseId)
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
  getListOfAcademicTermStatus(): void {
    let division: StaticData = new StaticData();
    ACADEMIC_TERM_STATUS.forEach(pair => {
      division = {
        Id: pair.Id,
        Description: pair.Description
      };
      this.listOfTermNumber.push(division);
    });
  }

  /**
   * Get list of batch codes based on academic term and year
   */
  getListOfBatch(termId: number = 0, termYear: number = 0) {
    this.courseTermOfferingService.getListOfBatchCodeByAcademicTerm(termId, termYear).subscribe(res => {
      this.listOfBatch = res;
      // Clear the batch code selection when term or year changes
      this.batchCode.setValue(null);
    });
  }

  /**
   * Get year range from 1998 to current year
   */
  getYearRange(currentYear: number): number[] {
    const startYear = 1998;
    const yearList = [];
    for (let year = startYear; year <= currentYear; year++) {
      yearList.push(year);
    }
    return yearList.reverse();
  }

  /**
   * Search for lab section assigned students based on form parameters
   */
  onSearch(batchCode: string, sectionId?: any): void {
    if (batchCode) {
      this.loading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const { academicTerm, year } = this.searchForm.value;
      // Use the passed sectionId if provided, otherwise read from form
      const actualSectionId = sectionId !== undefined ? sectionId : this.searchForm.value.sectionId;
      console.log("%%     ", actualSectionId);
      // First, check if lab sections have already been generated for this batch
      this.checkLabSectionGenerationStatus(batchCode, academicTerm, year, actualSectionId);

      this.studentSectionAssignmentService
        .getListOfSectionAssignedStudentsForLab(batchCode, academicTerm, year, actualSectionId)
        .subscribe({
          next: (response) => {
            this.loading = false;
            if (response.data) {
              this.labSectionAssignedStudents = response.data;
              this.listOfData = [...this.labSectionAssignedStudents];
              this.listOfDisplayData = [...this.labSectionAssignedStudents];



              // Check if lab sections are already generated by examining the student data
              this.checkLabSectionStatusFromData();

              this.successMessage = `Found ${this.labSectionAssignedStudents.length} students in lab sections`;
              // Collapse the search section when data is returned
              this.isSearchCollapsed = true;

              // Auto-suggest optimal sections when data is loaded
              if (this.labSectionAssignedStudents.length > 0) {
                this.suggestOptimalSections();
              }
            } else {
              this.labSectionAssignedStudents = [];
              this.listOfData = [];
              this.listOfDisplayData = [];
              this.errorMessage = response.error || 'No data found';
            }
          },
          error: (error) => {
            this.loading = false;
            this.errorMessage = 'Error loading lab section assigned students. Please try again.';
            console.error('Error fetching lab section assigned students:', error);
          }
        });
    } else {
      this.errorMessage = 'Please fill in all required fields correctly.';
    }
  }

  /**
   * Clear the search results
   */
  clearSearch(): void {
    this.labSectionAssignedStudents = [];
    this.listOfData = [];
    this.listOfDisplayData = [];
    this.errorMessage = '';
    this.successMessage = '';
    this.searchValue = '';
    this.listOfBatch = [];
    this.searchForm.reset();

    // Reset section-related values
    this.numberOfSections = 1;
    this.studentsPerSection = 45;
    this.generatingAssignments = false;

    // Reset section generation status
    this.numberOfGeneratedSections = 0;
    this.isSectionGenerated = false;
  }

  /**
   * Clear error message manually
   */
  clearErrorMessage(): void {
    this.errorMessage = '';
  }

  /**
   * Clear success message manually
   */
  clearSuccessMessage(): void {
    this.successMessage = '';
  }

  /**
   * Check if lab sections have already been generated for the current batch
   */
  private checkLabSectionGenerationStatus(batchCode: string, academicTerm: number, year: number, sectionId: number): void {
    // Since we don't have a separate API to check status, we'll check it from the student data response
    // This method will be called before the main search to prepare the status
    // The actual status will be determined from the response data
    console.log('Checking lab section generation status for:', { batchCode, academicTerm, year });
  }

  /**
   * Check lab section status from the loaded student data
   */
  private checkLabSectionStatusFromData(): void {
    if (this.labSectionAssignedStudents.length > 0) {
      // Use the numberOfGeneratedSections value from the API response
      // This is the correct value from the backend
      const firstStudent = this.labSectionAssignedStudents[0];

      if (firstStudent && firstStudent.numberOfGeneratedSections !== undefined) {
        this.numberOfGeneratedSections = firstStudent.numberOfGeneratedSections;
        this.isSectionGenerated = firstStudent.numberOfGeneratedSections > 0;

        console.log(`✅ Lab sections status from API: ${this.numberOfGeneratedSections} sections generated, isGenerated: ${this.isSectionGenerated}`);

        // Additional validation: also check if students have section assignments
        const studentsWithSections = this.labSectionAssignedStudents.filter(student =>
          student.sectionId && student.sectionId > 0
        );

        if (studentsWithSections.length > 0) {
          console.log(`Students assigned to ${studentsWithSections.length} sections`);
        }
      } else {
        // Fallback: check if students have section assignments by looking at their sectionId
        const studentsWithSections = this.labSectionAssignedStudents.filter(student =>
          student.sectionId && student.sectionId > 0
        );

        if (studentsWithSections.length > 0) {
          // Count unique sections as fallback
          const uniqueSections = new Set(studentsWithSections.map(student => student.sectionId));
          this.numberOfGeneratedSections = uniqueSections.size;
          this.isSectionGenerated = true;

          console.log(`⚠️ Lab sections calculated from student data: ${this.numberOfGeneratedSections} sections for ${studentsWithSections.length} students`);
        } else {
          // No sections generated
          this.numberOfGeneratedSections = 0;
          this.isSectionGenerated = false;
          console.log('❌ No lab sections generated yet');
        }
      }
    } else {
      // No students found
      this.numberOfGeneratedSections = 0;
      this.isSectionGenerated = false;
      console.log('❌ No students found in response');
    }
  }

  /**
   * Clear current lab section assignments
   */
  clearLabSectionAssignments(): void {
    if (this.labSectionAssignedStudents.length === 0) {
      this.errorMessage = 'No assignments to clear.';
      return;
    }

    this.notificationService.notification('warning', 'Warning', 'This will clear all current lab section assignments. Are you sure?');
    // Note: In a real implementation, you would call an API to clear assignments
    // For now, we'll just refresh the data
    const { batchCode } = this.searchForm.value;
    if (batchCode) {
      this.onSearch(batchCode);
    }
  }
  removeGeneratedAssignments(): void {
    // Show confirmation dialog before removing sections
    this.showRemoveConfirmation();
  }

  private showRemoveConfirmation(): void {
    this.modalService.confirm({
      nzTitle: 'Remove Generated Sections',
      nzContent: 'Are you sure you want to remove all generated section assignments? This action cannot be undone.',
      nzOkText: 'Yes, Remove',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Cancel',
      nzOnOk: () => {
        this.executeRemoveGeneratedAssignments();
      }
    });
  }

  private executeRemoveGeneratedAssignments(): void {
    const { batchCode, academicTerm, year } = this.searchForm.value;
    this.studentSectionAssignmentService.deleteStudentSectionAssignment(academicTerm, year, batchCode, 1).subscribe({
      next: (res) => {
        this.successMessage = 'Successfully removed generated section assignments.';
        this.isSectionGenerated = false;
        this.numberOfGeneratedSections = 0;
        this.numberOfSections = this.getCalculatedNumberOfSections();
      },
      error: (error) => {
        this.errorMessage = 'Error removing generated section assignments. Please try again.';
        console.error('Error removing section assignments:', error);
      }
    });
  }
  search(): void {
    const filterValue = this.searchValue.toLowerCase();
    this.listOfDisplayData = this.listOfData.filter((item: LabSectionAssignedStudentInfo) =>
      item.fullName.toLowerCase().includes(filterValue) ||
      item.studentCode.toLowerCase().includes(filterValue) ||
      item.batchCode.toLowerCase().includes(filterValue) ||
      item.section.toLowerCase().includes(filterValue)
    );
  }

  exportLabSectionList(): void {
    // Implementation for exporting lab section list
    this.notificationService.notification('info', 'Info', 'Export functionality will be implemented');
  }

  /**
   * Get total number of students
   */
  getTotalStudents(): number {
    return this.labSectionAssignedStudents.length;
  }

  /**
   * Calculate number of sections based on total students divided by students per section
   */
  getCalculatedNumberOfSections(): number {
    const totalStudents = this.getTotalStudents();
    if (this.numberOfSections <= 0 || totalStudents === 0) {
      return 0;
    }
    return Math.ceil(totalStudents / this.numberOfSections);
  }

  /**
   * Handle when user changes the number of sections
   */
  onNumberOfSectionsChange(): void {
    const totalStudents = this.getTotalStudents();
    if (this.numberOfSections > 0 && totalStudents > 0) {
      // Calculate new students per section based on user input
      this.studentsPerSection = Math.ceil(totalStudents / this.numberOfSections);

      // Clear previous error messages
      this.errorMessage = '';

      // Provide feedback on the distribution
      if (this.studentsPerSection > 50) {
        this.errorMessage = `Warning: ${this.studentsPerSection} students per section may be too many for effective lab management.`;
      } else if (this.studentsPerSection < 10) {
        this.errorMessage = `Note: ${this.studentsPerSection} students per section may result in underutilized lab resources.`;
      }
    }
  }

  /**
   * Suggest optimal number of sections based on total students
   */
  suggestOptimalSections(): void {
    const totalStudents = this.getTotalStudents();
    if (totalStudents > 0) {
      // Suggest sections based on ideal students per section (25-35 students per section)
      const idealStudentsPerSection = 30;
      const suggestedSections = Math.ceil(totalStudents / idealStudentsPerSection);

      // Ensure suggested sections are within reasonable bounds
      const finalSuggestion = Math.max(1, Math.min(suggestedSections, Math.min(20, totalStudents)));

      this.numberOfSections = finalSuggestion;
      this.onNumberOfSectionsChange();

      this.successMessage = `Suggested ${finalSuggestion} sections for optimal lab management (${Math.ceil(totalStudents / finalSuggestion)} students per section)`;
    }
  }

  /**
   * Generate lab section assignments
   */
  generateLabSectionAssignments(): void {
    if (this.labSectionAssignedStudents.length === 0) {
      this.errorMessage = 'No students available for lab section assignment generation.';
      return;
    }

    if (!this.numberOfSections || this.numberOfSections <= 0) {
      this.errorMessage = 'Please enter a valid number of sections (must be greater than 0).';
      return;
    }

    // Additional validation: ensure numberOfSections is not greater than total students
    if (this.numberOfSections > this.labSectionAssignedStudents.length) {
      this.errorMessage = `Number of sections (${this.numberOfSections}) cannot be greater than total students (${this.labSectionAssignedStudents.length}).`;
      return;
    }

    // Additional validation: ensure numberOfSections is reasonable (not too many)
    const maxReasonableSections = Math.min(20, this.labSectionAssignedStudents.length);
    if (this.numberOfSections > maxReasonableSections) {
      this.errorMessage = `Number of sections (${this.numberOfSections}) is too high. Maximum recommended: ${maxReasonableSections}`;
      return;
    }

    this.generatingAssignments = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { academicTerm, year, batchCode } = this.searchForm.value;
    const totalStudents = this.getTotalStudents();

    // Create the request payload based on the C# models
    const request: LabSectionAssignmentRequest = {
      batchCode: batchCode,
      academicTerm: academicTerm,
      year: year,
      numberOfSections: this.numberOfSections,
      sectionId: this.sectionId.value,
      students: this.labSectionAssignedStudents.map(student => ({
        sectionId: student.sectionId, // Will be assigned by the backend
        studentId: student.id
      }))
    };

    // Validate that we have students data
    if (!request.students || request.students.length === 0) {
      this.errorMessage = 'No students data available for assignment.';
      this.generatingAssignments = false;
      return;
    }

    console.log('Generating lab section assignments:', {
      request,
      totalStudents,
      numberOfSections: this.numberOfSections,
      studentsPerSection: this.studentsPerSection
    });

    // Call the service to generate lab section assignments
    this.studentSectionAssignmentService.assignStudentLabSections(request).subscribe({
      next: (response) => {
        this.generatingAssignments = false;

        // Handle different response structures
        let isSuccess = false;
        let message = '';

        if (response.success !== undefined) {
          isSuccess = response.success;
          message = response.message || response.error || '';
        } else if (response.status !== undefined) {
          isSuccess = response.status === 'success' || response.status === 200;
          message = response.message || response.error || '';
        } else if (response.data !== undefined) {
          isSuccess = true;
          message = 'Lab section assignments generated successfully';
        } else {
          // If no clear success indicator, assume success if no error
          isSuccess = !response.error;
          message = response.message || response.error || 'Lab section assignments processed';
        }

        if (isSuccess) {
          this.successMessage = `Successfully generated ${this.numberOfSections} lab sections for ${totalStudents} students`;

          // Update the section generation status
          this.isSectionGenerated = true;
          this.numberOfGeneratedSections = this.numberOfSections;

          // Refresh the data to show updated assignments
          this.onSearch(batchCode);
        } else {
          this.errorMessage = message || 'Failed to generate lab section assignments';
        }

        console.log('Lab section assignments response:', response);
      },
      error: (error) => {
        this.generatingAssignments = false;
        this.errorMessage = 'Error generating lab section assignments. Please try again.';
        console.error('Error generating lab section assignments:', error);
      }
    });
  }
}
