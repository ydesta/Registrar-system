import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
// import { StudentSectionAssignmentService } from '../services/student-section-assignment.service';
// import { StudentRegisteredCoursesModel, StudentRegisteredCoursesResult } from '../Models/StudentRegisteredCoursesModel';
import { BulkSectionAssignmentRequest } from '../Models/BulkSectionAssignmentRequest';
import { CourseSectionAssignment } from '../Models/CourseSectionAssignment';
import { ACADEMIC_TERM_STATUS } from 'src/app/common/constant';
import { TermCourseOfferingService } from 'src/app/colleges/services/term-course-offering.service';
import { StaticData } from 'src/app/admission-request/model/StaticData';
import { StudentRegisteredCoursesModel, StudentRegisteredCoursesResult } from '../Models/StudentRegisteredCoursesModel';
import { StudentSectionAssignmentService } from '../services/student-section-assignment.service';

@Component({
  selector: 'app-student-section-assignments',
  templateUrl: './student-section-assignments.component.html',
  styleUrls: ['./student-section-assignments.component.scss']
})
export class StudentSectionAssignmentsComponent implements OnInit {
  // Component data
  registeredCourses: StudentRegisteredCoursesResult = { totalDistinctCount: 0, courses: [] };
  loading = false;
  generatingAssignments = false;
  studentsPerSection = 45; // Default value
  numberOfSections = 0; // User input for number of sections
  errorMessage = '';
  successMessage = '';

  // Form data
  searchForm: FormGroup;
  listOfTermNumber: StaticData[] = [];
  yearList: number[] = [];
  listOfBatch: any[] = [];

  // Math utility for template
  Math = Math;
  
  // Collapse state
  isSearchCollapsed = false;

  constructor(
    private fb: FormBuilder,
    private studentSectionAssignmentService: StudentSectionAssignmentService,
    private courseTermOfferingService: TermCourseOfferingService
  ) {
    const currentYear = new Date().getFullYear();
    this.yearList = this.getYearRange(currentYear);
    this.getListOfAcademicTermStatus();
    this.createSearchForm();
  }

  ngOnInit(): void {
    // Subscribe to academicTerm changes
    this.academicTerm.valueChanges.subscribe(res => {
      if (res && this.year.value) {
        this.getListOfBatch(res, this.year.value);
      }
    });

    // Subscribe to year changes
    this.year.valueChanges.subscribe(year => {
      if (year && this.academicTerm.value) {
        this.getListOfBatch(this.academicTerm.value, year);
      }
    });

    this.batchCode.valueChanges.subscribe(res => {
      // console.log("%%     ", res);
      // if (res) {
        this.onSearch(res);
      // }

    })
  }

  private createSearchForm() {
    this.searchForm = this.fb.group({
      academicTerm: [null, Validators.required],
      year: [null, Validators.required],
      batchCode: [null, Validators.required]
    });
  }

  get academicTerm() {
    return this.searchForm.get("academicTerm");
  }

  get year() {
    return this.searchForm.get("year");
  }

  get batchCode() {
    return this.searchForm.get("batchCode");
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
   * Get list of academic term status from constants
   */
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

  /**
   * Get list of batch codes based on academic term and year
   */
  getListOfBatch(termId: number = 0, termYear: number = 0) {
    this.courseTermOfferingService.getListOfBatchCodeByAcademicTerm(termId, termYear).subscribe(res => {
      this.listOfBatch = res;
    });
  }

  /**
   * Search for student registered courses based on form parameters
   */
  onSearch(batchCode: string): void {
    if (batchCode) {
      this.loading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const { academicTerm, year } = this.searchForm.value;
      console.log("Batch Code  ", batchCode);
      this.studentSectionAssignmentService
        .getStudentRegisteredCourses(batchCode, academicTerm, year)
        .subscribe({
          next: (res: StudentRegisteredCoursesResult) => {
            this.registeredCourses = res;
            console.log("objects ", this.registeredCourses);
            this.loading = false;
            if (res.courses.length > 0) {
              // Automatically set numberOfSections based on calculated sections
              this.numberOfSections = this.getCalculatedNumberOfSections();
              // Collapse the search section when data is returned
              this.isSearchCollapsed = true;
              // this.successMessage = `Found ${res.courses.length} registered courses for batch ${batchCode} (Total students: ${res.totalDistinctCount})`;
            } else {
              this.successMessage = 'No registered courses found for the specified criteria';
            }
          },
          error: (error) => {
            this.loading = false;
            this.errorMessage = 'Error loading registered courses. Please try again.';
            console.error('Error fetching registered courses:', error);
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
    this.registeredCourses = { totalDistinctCount: 0, courses: [] };
    this.errorMessage = '';
    this.successMessage = '';
    this.searchForm.reset();
  }

  /**
   * Get academic term display name
   */
  getAcademicTermName(term: number): string {
    switch (term) {
      case 1: return 'Winter';
      case 2: return 'Spring';
      case 3: return 'Summer';
      case 4: return 'Autumn';
      default: return `Term ${term}`;
    }
  }

  /**
   * Get section status display
   */
  getSectionStatus(course: StudentRegisteredCoursesModel): string {
    if (course.isDefaultSection) {
      return 'Default Section';
    }
    return `Regular Sections (${course.numberOfSections})`;
  }

  /**
   * Calculate total students across all courses
   */
  getTotalStudents(): number {
    return this.registeredCourses.totalDistinctCount;
  }

  /**
   * Calculate total courses
   */
  getTotalCourses(): number {
    return this.registeredCourses.courses.length;
  }

  /**
   * Calculate total sections across all courses
   */
  getTotalSections(): number {
    return this.registeredCourses.courses.reduce((total, course) => total + course.numberOfSections, 0);
  }

  /**
   * Calculate number of sections based on total students divided by students per section
   */
  getCalculatedNumberOfSections(): number {
    const totalStudents = this.getTotalStudents();
    if (this.studentsPerSection <= 0 || totalStudents === 0) {
      return 0;
    }
    return Math.ceil(totalStudents / this.studentsPerSection);
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

  viewCourseDetails(course: StudentRegisteredCoursesModel): void {
    console.log('Viewing course details:', course);
    // Implement course details view logic
  }

  assignSections(course: StudentRegisteredCoursesModel): void {
    console.log('Assigning sections for course:', course);
    // Implement section assignment logic
  }


  getRecommendations(course: StudentRegisteredCoursesModel): void {
    console.log('Getting recommendations for course:', course);
    // Implement recommendations logic
  }

  toggleDefaultSection(course: StudentRegisteredCoursesModel, isDefault: boolean): void {
    course.isDefaultSection = isDefault;
  }


  generateStudentCourseSectionAssignment(): void {
    if (this.registeredCourses.courses.length === 0) {
      this.errorMessage = 'No courses available for section assignment generation.';
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

    const courseAssignments: CourseSectionAssignment[] = this.registeredCourses.courses.map(course => ({
      courseId: course.courseId,
      maxStudentsPerSection: course.maxStudentsPerSection,
      useDefaultSection: course.isDefaultSection,
      defaultSectionId: course.isDefaultSection ? 1 : undefined,
      numberOfSections: course.numberOfSections,
      isDefaultSection: course.isDefaultSection
    }));

    const request: BulkSectionAssignmentRequest = {
      batchCode: batchCode,
      academicTerm: academicTerm,
      year: year,
      numberOfSections: this.numberOfSections,
      courseAssignments: courseAssignments
    };

    console.log('Generating student course section assignments with request: ', request);

    // Call the API to generate student course section assignments
    this.studentSectionAssignmentService.assignStudentsToSections(request).subscribe({
      next: (response) => {
        this.generatingAssignments = false;
        this.successMessage = `Successfully generated section assignments for ${this.registeredCourses.courses.length} courses with ${this.numberOfSections} sections`;
        console.log('Section assignments generated:', response);
      },
      error: (error) => {
        this.generatingAssignments = false;
        this.errorMessage = 'Error generating section assignments. Please try again.';
        console.error('Error generating section assignments:', error);
      }
    });
  }
} 