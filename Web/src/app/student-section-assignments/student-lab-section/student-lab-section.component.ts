import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LabSectionAssignedStudentInfo, LabSectionAssignedStudentsResponse } from '../../Models/LabSectionAssignedStudentModel';
import { CustomNotificationService } from '../../services/custom-notification.service';
import { ACADEMIC_TERM_STATUS } from '../../common/constant';
import { TermCourseOfferingService } from '../../colleges/services/term-course-offering.service';
import { StaticData } from '../../admission-request/model/StaticData';
import { StudentSectionAssignmentService } from '../../services/student-section-assignment.service';

@Component({
  selector: 'app-student-lab-section',
  templateUrl: './student-lab-section.component.html',
  styleUrls: ['./student-lab-section.component.scss']
})
export class StudentLabSectionComponent implements OnInit {
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

  // Table configuration
  listOfData: LabSectionAssignedStudentInfo[] = [];
  listOfDisplayData: LabSectionAssignedStudentInfo[] = [];
  searchValue = '';

  // Collapse state
  isSearchCollapsed = false;

  constructor(
    private fb: FormBuilder,
    private studentSectionAssignmentService: StudentSectionAssignmentService,
    private notificationService: CustomNotificationService,
    private courseTermOfferingService: TermCourseOfferingService
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
        this.onSearch(batchCode);
      }
    });
  }

  // Form getters
  get academicTerm() { return this.searchForm.get('academicTerm'); }
  get year() { return this.searchForm.get('year'); }
  get batchCode() { return this.searchForm.get('batchCode'); }

  createSearchForm(): void {
    this.searchForm = this.fb.group({
      academicTerm: [null, Validators.required],
      year: [null, Validators.required],
      batchCode: [null, Validators.required]
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
  onSearch(batchCode: string): void {
    if (batchCode) {
      this.loading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const { academicTerm, year } = this.searchForm.value;
      this.studentSectionAssignmentService
        .getListOfSectionAssignedStudentsForLab(batchCode, academicTerm, year)
        .subscribe({
          next: (response) => {
            console.log("#$%^&      ", response.data);
            this.loading = false;
            if (response.data) {
              this.labSectionAssignedStudents = response.data;
              this.listOfData = [...this.labSectionAssignedStudents];
              this.listOfDisplayData = [...this.labSectionAssignedStudents];
              this.successMessage = `Found ${this.labSectionAssignedStudents.length} students in lab sections`;
              // Collapse the search section when data is returned
              this.isSearchCollapsed = true;
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

    this.generatingAssignments = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { academicTerm, year, batchCode } = this.searchForm.value;
    const totalStudents = this.getTotalStudents();
    const calculatedSections = this.getCalculatedNumberOfSections();

    console.log('Generating lab section assignments:', {
      batchCode,
      academicTerm,
      year,
      totalStudents,
      numberOfSections: this.numberOfSections,
      studentsPerSection: this.studentsPerSection
    });

    // Simulate API call for now
    setTimeout(() => {
      this.generatingAssignments = false;
      this.successMessage = `Successfully calculated ${this.numberOfSections} lab sections for ${totalStudents} students (${this.studentsPerSection} students per section)`;
      console.log('Lab section assignments calculated');
    }, 2000);
  }
}
