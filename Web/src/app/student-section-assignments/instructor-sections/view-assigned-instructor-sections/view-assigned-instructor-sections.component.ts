import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { StaticData } from 'src/app/admission-request/model/StaticData';
import { ACADEMIC_TERM_STATUS, SECTION_TYPE } from 'src/app/common/constant';
import { BatchCodeListViewModel } from 'src/app/Models/BatchCodeListViewModel';
import { SectionAssignedStudentInfo } from 'src/app/Models/SectionAssignedStudentModel';
import { SectionViewModel } from 'src/app/Models/SectionViewModel';
import { StaffModel } from 'src/app/Models/StaffModel';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { InstructorSectionService } from 'src/app/services/instructor-section.service';
import { StaffService } from 'src/app/services/staff.service';
import { StudentSectionAssignmentService } from 'src/app/services/student-section-assignment.service';
import { CourseViewModel } from 'src/app/students/models/course-break-down-offering.model';

@Component({
  selector: 'app-view-assigned-instructor-sections',
  templateUrl: './view-assigned-instructor-sections.component.html',
  styleUrls: ['./view-assigned-instructor-sections.component.scss']
})
export class ViewAssignedInstructorSectionsComponent implements OnInit {
  staff: StaffModel | null = null;
  loading = true;
  error = false;

  listOfTermNumber: StaticData[] = [];
  listOfSectionType: StaticData[] = [];
  form!: FormGroup;
  yearList: number[] = [];
  errorMessage = '';
  successMessage = '';
  isSearchCollapsed = false;
  // Table configuration
  listOfData: SectionAssignedStudentInfo[] = [];
  listOfDisplayData: SectionAssignedStudentInfo[] = [];
  searchValue = '';
  sectionAssignedStudents: SectionAssignedStudentInfo[] = [];
  availableSections: SectionViewModel[] = [];
  listOfBatch: BatchCodeListViewModel[] = [];
  courseList: CourseViewModel[] = [];

  // Loading states for dependent dropdowns
  loadingBatches = false;
  loadingCourses = false;
  loadingSections = false;
  constructor(
    private router: Router,
    private staffService: StaffService,
    private notificationService: CustomNotificationService,
    private fb: FormBuilder,
    private studentSectionAssignmentService: StudentSectionAssignmentService,
    private instructorSectionService: InstructorSectionService,

  ) {
    const currentYear = new Date().getFullYear();
    this.yearList = this.getYearRange(currentYear);
    this.createForm();
  }

  ngOnInit(): void {
    this.loadStaffProfile();
    this.getListOfSectionType();
    this.getListOfAcademicTermStatus();

  }
  loadStaffProfile(): void {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      this.notificationService.notification('error', 'Error', 'User ID not found');
      this.error = true;
      this.loading = false;
      return;
    }

    this.staffService.getStaffByUserId(userId).subscribe({
      next: (response: any) => {
        if (response.status === 'success' && response.data) {
          this.staff = response.data;
          this.loading = false;
        } else {
          // Redirect to add-staff/null if no profile
          this.router.navigate(['/staffs/add-staff', 'null']);
        }
      },
      error: (error) => {
        console.error('Error loading staff profile:', error);
        // Redirect to add-staff/null if error (e.g., not found)
        this.router.navigate(['/staffs/add-staff', 'null']);
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
  createForm(): void {
    this.form = this.fb.group({
      academicTerm: [null, [Validators.required]],
      year: [null, [Validators.required]],
      batchId: [null, [Validators.required]],
      sectionType: [null, [Validators.required]],
      sectionId: [null, [Validators.required]],
      courseId: [null, [Validators.required]],
    });
  }
  get year() {
    return this.form.get("year");
  }
  get sectionType() {
    return this.form.get("sectionType");
  }


  get batchId() {
    return this.form.get("batchId");
  }

  get sectionId() {
    return this.form.get("sectionId");
  }


  getYearRange(currentYear: number): number[] {
    const startYear = 1998;
    const yearList = [];
    for (let year = startYear; year <= currentYear; year++) {
      yearList.push(year);
    }
    return yearList.reverse();
  }

  searchSectionAssignedStudents(): void {
    if (this.form.valid) {
      this.loading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const { batchId, academicTerm, year, sectionType, courseId, sectionId } = this.form.value;
      this.studentSectionAssignmentService
        .getListOfSectionAssignedStudents(batchId, academicTerm, year, sectionType, courseId || undefined, sectionId || undefined)
        .subscribe({
          next: (response) => {
            this.loading = false;
            this.isSearchCollapsed = true;
            if (response.status === 'success' && response.data) {
              this.sectionAssignedStudents = response.data;
              this.listOfData = [...this.sectionAssignedStudents];
              this.listOfDisplayData = [...this.sectionAssignedStudents];
              this.successMessage = `Found ${this.sectionAssignedStudents.length} section assigned students`;
              this.notificationService.notification('success', 'Success', this.successMessage);
            } else {
              this.errorMessage = response.error || 'No data found';
              this.notificationService.notification('error', 'Error', this.errorMessage);
            }
          },
          error: (error) => {
            this.loading = false;
            this.errorMessage = 'Error retrieving section assigned students. Please try again.';
            this.notificationService.notification('error', 'Error', this.errorMessage);
          }
        });
    } else {
      this.notificationService.notification('error', 'Validation Error', 'Please fill in all required fields.');
    }
  }
  getStaffTeachingDataAsync(): void {
    const { academicTerm, year, sectionType } = this.form.value;
    if (this.year?.value && this.staff?.id) {
      // Set loading states
      this.loadingBatches = true;
      this.loadingCourses = true;
      this.loadingSections = true;

      this.instructorSectionService.getStaffTeachingDataAsync(this.staff.id, academicTerm, year, sectionType).subscribe({
        next: (response) => {
          if (response && response.sections) {
            this.availableSections = response.sections;
            this.listOfBatch = response.batches;
            this.courseList = response.courses;
          } else {
            this.availableSections = [];
            this.listOfBatch = [];
            this.courseList = [];
          }
          // Clear loading states
          this.loadingBatches = false;
          this.loadingCourses = false;
          this.loadingSections = false;
        },
        error: (error) => {
          console.error('Error fetching teaching data:', error);
          this.availableSections = [];
          this.listOfBatch = [];
          this.courseList = [];
          // Clear loading states on error
          this.loadingBatches = false;
          this.loadingCourses = false;
          this.loadingSections = false;
        }
      });
    }
  }
  onCourseChange(): void {
    this.form.patchValue({
      sectionId: null
    });
    this.availableSections = [];
  }

  // Add missing methods
  search(): void {
    const filterFunc = (item: SectionAssignedStudentInfo) =>
      (this.searchValue ? item.fullName.toLowerCase().indexOf(this.searchValue.toLowerCase()) !== -1 : true);

    const data = this.listOfData.filter(item => filterFunc(item));
    this.listOfDisplayData = data;
  }

  resetSearch(): void {
    this.form.reset();
    this.sectionAssignedStudents = [];
    this.listOfData = [];
    this.listOfDisplayData = [];
    this.searchValue = '';
    this.errorMessage = '';
    this.successMessage = '';
    this.availableSections = [];
    this.listOfBatch = [];
    this.courseList = [];
  }

  // Handle form field changes to populate dependent dropdowns
  onAcademicTermChange(): void {
    this.form.patchValue({
      year: null,
      batchId: null,
      sectionType: null,
      courseId: null,
      sectionId: null
    });
    this.availableSections = [];
    this.listOfBatch = [];
    this.courseList = [];
  }

  onYearChange(): void {
    this.form.patchValue({
      batchId: null,
      sectionType: null,
      courseId: null,
      sectionId: null
    });
    this.availableSections = [];
    this.listOfBatch = [];
    this.courseList = [];
  }

  onSectionTypeChange(): void {
    if (this.form.get('academicTerm')?.value && this.form.get('year')?.value) {
      this.getStaffTeachingDataAsync();
    }
    this.form.patchValue({
      courseId: null,
      sectionId: null
    });
    this.availableSections = [];
    this.courseList = [];
  }

  // Helper method for academic term names
  getAcademicTermName(term: number): string {
    switch (term) {
      case 1: return 'Winter';
      case 2: return 'Spring';
      case 3: return 'Summer';
      case 4: return 'Autumn';
      default: return `Term ${term}`;
    }
  }

  // Export functionality - copied exactly from SectionAssignedStudents
  exportToCSV(): void {
    if (this.sectionAssignedStudents.length === 0) {
      this.notificationService.notification('warning', 'Warning', 'No data to export');
      return;
    }

    const headers = ['Student Code', 'Batch Code', 'Full Name', 'Section', 'Course Code', 'Course Title'];
    const csvContent = [
      headers.join(','),
      ...this.sectionAssignedStudents.map(student => [
        student.studentCode,
        student.batchCode,
        student.fullName,
        student.section,
        student.courseCode,
        student.courseTitle
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `section-assigned-students-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    this.notificationService.notification('success', 'Success', 'Data exported successfully');
  }

  exportAttendanceSheet(): void {
    if (this.sectionAssignedStudents.length === 0) {
      this.notificationService.notification('warning', 'Warning', 'No data to export');
      return;
    }

    // Get form values for header information
    const academicTerm = this.form.get('academicTerm')?.value;
    const year = this.form.get('year')?.value;
    const courseId = this.form.get('courseId')?.value;
    const sectionId = this.form.get('sectionId')?.value;

    // Get course and section information
    const selectedCourse = this.courseList.find(c => c.id === courseId);
    const selectedSection = this.availableSections.find(s => s.id === sectionId);

    // Create HTML table with borders for Excel export
    let htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <title>Class Attendance Sheet</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .school-title { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
            .sheet-title { font-size: 16px; font-weight: bold; margin-bottom: 15px; }
            .info-row { margin-bottom: 10px; }
            .info-label { font-weight: bold; display: inline-block; width: 100px; }
            table { border-collapse: collapse; width: 100%; margin-top: 20px; }
            th, td { 
              border: 1px solid #000; 
              padding: 8px; 
              text-align: center; 
              mso-border-alt: solid black .5pt;
            }
            th { 
              background-color: #f0f0f0; 
              font-weight: bold; 
              mso-pattern: solid #f0f0f0;
            }
            .name-col { text-align: left; width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .batch-col { width: 100px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .attendance-col { width: 40px; }
            .no-col { width: 50px; }
            .header-info { margin-bottom: 15px; }
            .info-row { margin-bottom: 8px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="school-title">HILCoE School of Computer Science & Technology</div>
            <div class="sheet-title">Class Attendance Sheet</div>
          </div>
          
          <div class="header-info">
            <div class="info-row"><strong>Class:</strong> ${this.form.get('batchId')?.value || 'N/A'}</div>
            <div class="info-row"><strong>Term:</strong> ${this.getAcademicTermName(academicTerm)} ${year}</div>
            <div class="info-row"><strong>Section:</strong> ${selectedSection?.sectionName || 'N/A'}</div>
            <div class="info-row"><strong>Course Code:</strong> ${selectedCourse?.courseCode || 'N/A'}</div>
            <div class="info-row"><strong>Instructor:</strong> _________________</div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th class="no-col">No.</th>
                <th class="name-col">Name</th>
                <th class="batch-col">Batch</th>
                ${Array.from({ length: 24 }, (_, i) => `<th class="attendance-col">${i + 1}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${this.sectionAssignedStudents.map((student, index) => `
                <tr>
                  <td class="no-col">${index + 1}</td>
                  <td class="name-col">${student.fullName}</td>
                  <td class="batch-col">${student.batchCode}</td>
                  ${Array.from({ length: 24 }, () => '<td class="attendance-col"></td>').join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-sheet-${selectedCourse?.courseCode || 'course'}-${selectedSection?.sectionName || 'section'}-${new Date().toISOString().split('T')[0]}.xls`;
    link.click();
    window.URL.revokeObjectURL(url);

    this.notificationService.notification('success', 'Success', 'Attendance sheet exported successfully');
  }

  exportMarkList(): void {
    if (this.sectionAssignedStudents.length === 0) {
      this.notificationService.notification('warning', 'Warning', 'No data to export');
      return;
    }

    // Get form values for header information
    const academicTerm = this.form.get('academicTerm')?.value;
    const year = this.form.get('year')?.value;
    const courseId = this.form.get('courseId')?.value;
    const sectionId = this.form.get('sectionId')?.value;

    // Get course and section information
    const selectedCourse = this.courseList.find(c => c.id === courseId);
    const selectedSection = this.availableSections.find(s => s.id === sectionId);

    // Create HTML table with borders for Excel export
    let htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <title>Result Submission Sheet</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .school-title { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
            .sheet-title { font-size: 16px; font-weight: bold; margin-bottom: 15px; }
            .info-section { margin-bottom: 15px; display: flex; justify-content: space-between; }
            .left-info { width: 50%; }
            .right-info { width: 50%; text-align: right; }
            .info-row { margin-bottom: 8px; }
            table { border-collapse: collapse; width: 100%; margin-top: 20px; }
            th, td { 
              border: 1px solid #000; 
              padding: 8px; 
              text-align: center; 
              mso-border-alt: solid black .5pt;
            }
            th { 
              background-color: #f0f0f0; 
              font-weight: bold; 
              mso-pattern: solid #f0f0f0;
            }
            .name-col { text-align: left; width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .batch-col { width: 100px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .score-col { width: 65px; text-align: right; }
            .grade-col { width: 60px; }
            .remark-col { width: 80px; }
            .scode-col { width: 120px; text-align: left; }
            .total-col { width: 90px; text-align: right; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="school-title">HILCoE School of Computer Science & Technology</div>
            <div class="sheet-title">Result Submission Sheet</div>
          </div>
          
          <div class="info-section">
            <div class="left-info">
              <div class="info-row"><strong>Class:</strong> ${this.form.get('batchId')?.value || 'N/A'}</div>
              <div class="info-row"><strong>Term:</strong> ${this.getAcademicTermName(academicTerm)} ${year}</div>
              <div class="info-row"><strong>Course Code:</strong> ${selectedCourse?.courseCode || 'N/A'}</div>
              <div class="info-row"><strong>Instructor:</strong> _________________</div>
            </div>
            <div class="right-info">
              <div class="info-row"><strong>Section:</strong> ${selectedSection?.sectionName || 'N/A'}</div>
              <div class="info-row"><strong>Date of Submission:</strong> ${new Date().toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' })}</div>
              <div class="info-row"><strong>Signature:</strong> _________________</div>
            </div>
          </div>
          
          <table style="border-collapse: collapse; border: 1px solid black;">
            <thead>
              <tr>
                <th class="scode-col" style="border: 1px solid black;">Student Code</th>
                <th class="name-col" style="border: 1px solid black;">Full Name</th>
                <th class="batch-col" style="border: 1px solid black;">Batch</th>
                <th class="score-col" style="border: 1px solid black;">30%</th>
                <th class="score-col" style="border: 1px solid black;">60%</th>
                <th class="score-col" style="border: 1px solid black;">55%</th>
                <th class="score-col" style="border: 1px solid black;">15%</th>
                <th class="total-col" style="border: 1px solid black;">Total(100%)</th>
                <th class="grade-col" style="border: 1px solid black;">Grade</th>
                <th class="remark-col" style="border: 1px solid black;">Remark</th>
              </tr>
            </thead>
            <tbody>
              ${this.sectionAssignedStudents.map((student, index) => `
                <tr>
                  <td class="scode-col" style="border: 1px solid black;">${student.studentCode}</td>
                  <td class="name-col" style="border: 1px solid black;">${student.fullName}</td>
                  <td class="batch-col" style="border: 1px solid black;">${student.batchCode}</td>
                  <td class="score-col" style="border: 1px solid black;"></td>
                  <td class="score-col" style="border: 1px solid black;"></td>
                  <td class="score-col" style="border: 1px solid black;"></td>
                  <td class="score-col" style="border: 1px solid black;"></td>
                  <td class="total-col" style="border: 1px solid black;"></td>
                  <td class="grade-col" style="border: 1px solid black;"></td>
                  <td class="remark-col" style="border: 1px solid black;"></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mark-list-${selectedCourse?.courseCode || 'course'}-${selectedSection?.sectionName || 'section'}-${new Date().toISOString().split('T')[0]}.xls`;
    link.click();
    window.URL.revokeObjectURL(url);

    this.notificationService.notification('success', 'Success', 'Mark list exported successfully');
  }
}
