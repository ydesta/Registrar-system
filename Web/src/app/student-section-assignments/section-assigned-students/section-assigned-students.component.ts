import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SectionAssignedStudentInfo } from '../../Models/SectionAssignedStudentModel';
import { SectionViewModel } from '../../Models/SectionViewModel';
import { CustomNotificationService } from '../../services/custom-notification.service';
import { ACADEMIC_TERM_STATUS, SECTION_TYPE } from '../../common/constant';
import { TermCourseOfferingService } from '../../colleges/services/term-course-offering.service';
import { StaticData } from '../../admission-request/model/StaticData';
import { StudentSectionAssignmentService } from 'src/app/services/student-section-assignment.service';
import { StudentRegisteredCoursesModel, StudentRegisteredCoursesResult } from 'src/app/Models/StudentRegisteredCoursesModel';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-section-assigned-students',
  templateUrl: './section-assigned-students.component.html',
  styleUrls: ['./section-assigned-students.component.scss']
})
export class SectionAssignedStudentsComponent implements OnInit {
  searchForm: FormGroup;
  sectionAssignedStudents: SectionAssignedStudentInfo[] = [];
  availableSections: SectionViewModel[] = [];
  loading = false;
  loadingSections = false;
  loadingCourses = false;
  errorMessage = '';
  successMessage = '';

  // Table configuration
  listOfData: SectionAssignedStudentInfo[] = [];
  listOfDisplayData: SectionAssignedStudentInfo[] = [];
  searchValue = '';

  // Form data - same as StudentSectionAssignmentsComponent
  listOfTermNumber: StaticData[] = [];
  listOfSectionType: StaticData[] = [];
  yearList: number[] = [];
  listOfBatch: any[] = [];
  listOfSections: SectionViewModel[] = [];
  registeredCourses: StudentRegisteredCoursesModel[] = [];
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
    this.getListOfSectionType();
    this.academicTerm.valueChanges.subscribe(res => {
      if (res && this.year.value) {
        this.getListOfBatch(res, this.year.value);
      }
    });

    this.year.valueChanges.subscribe(year => {
      if (year && this.academicTerm.value) {
        this.getListOfBatch(this.academicTerm.value, year);
      }
    });

    // Subscribe to batchCode changes to load available sections
    // this.batchCode.valueChanges.subscribe(batchCode => {
    //   if (batchCode && this.academicTerm.value && this.year.value) {
    //     this.loadAvailableSections();
    //     this.getListOfCourse();
    //   }

    // });

    this.sectionType.valueChanges.subscribe(sectionType => {

      if (this.academicTerm.value && this.year.value && this.batchCode.value) {
        this.getListOfCourse();
      }

    });
     this.courseId.valueChanges.subscribe(course => {

      if (course && this.academicTerm.value && this.year.value && this.batchCode.value) {
        this.loadAvailableSections();
      }

    });
    
  }

  private createSearchForm() {
    this.searchForm = this.fb.group({
      academicTerm: [null, Validators.required],
      year: [null, Validators.required],
      batchCode: [null, Validators.required],
      sectionType: [null, Validators.required],
      courseId: [null, Validators.required],
      sectionId: [null, Validators.required]
    });
  }

  get academicTerm() {
    return this.searchForm.get("academicTerm");
  }

  get year() {
    return this.searchForm.get("year");
  }
  get sectionType() {
    return this.searchForm.get("sectionType");
  }

  get batchCode() {
    return this.searchForm.get("batchCode");
  }
  get courseId() {
    return this.searchForm.get("courseId");
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
  getListOfCourse() {
    if (!this.batchCode.value || !this.academicTerm.value || !this.year.value) {
      return;
    }

    this.loadingCourses = true;
    this.registeredCourses = [];
    this.errorMessage = '';
    this.successMessage = '';

    const academicTerm = this.academicTerm.value;
    const year = this.year.value;
    const batchCode = this.batchCode.value;
    const sectionType = this.sectionType.value;
    this.studentSectionAssignmentService
      .getStudentRegisteredCourses(batchCode, academicTerm, year, sectionType)
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

  loadAvailableSections(): void {
    if (!this.batchCode.value || !this.academicTerm.value || !this.year.value) {
      return;
    }
    this.loadingSections = true;
    this.availableSections = [];
    this.listOfSections = [];

    this.studentSectionAssignmentService
      .getListOfSectionBasedOnBatch(this.batchCode.value, this.academicTerm.value, this.year.value, this.sectionType.value,this.courseId.value)
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

  searchSectionAssignedStudents(): void {
    if (this.searchForm.valid) {
      this.loading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const { batchCode, academicTerm, year, sectionType, courseId, sectionId } = this.searchForm.value;

      this.studentSectionAssignmentService
        .getListOfSectionAssignedStudents(batchCode, academicTerm, year, sectionType, courseId || undefined, sectionId || undefined)
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

  resetSearch(): void {
    this.searchForm.reset();
    this.sectionAssignedStudents = [];
    this.availableSections = [];
    this.listOfSections = [];
    this.registeredCourses = [];
    this.listOfData = [];
    this.listOfDisplayData = [];
    this.errorMessage = '';
    this.successMessage = '';
  }

  loadSections(): void {
    if (this.searchForm.valid) {
      this.loadAvailableSections();
    } else {
      this.notificationService.notification('error', 'Validation Error', 'Please fill in all required fields (Academic Term, Year, and Batch Code).');
    }
  }

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
    const academicTerm = this.academicTerm.value;
    const year = this.year.value;
    const courseId = this.searchForm.get('courseId')?.value;
    const sectionId = this.searchForm.get('sectionId')?.value;

    // Get course and section information
    const selectedCourse = this.registeredCourses.find(c => c.courseId === courseId);
    const selectedSection = this.listOfSections.find(s => s.id === sectionId);

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
            <div class="info-row"><strong>Class:</strong> ${this.batchCode.value || 'N/A'}</div>
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
    const academicTerm = this.academicTerm.value;
    const year = this.year.value;
    const courseId = this.searchForm.get('courseId')?.value;
    const sectionId = this.searchForm.get('sectionId')?.value;

    // Get course and section information
    const selectedCourse = this.registeredCourses.find(c => c.courseId === courseId);
    const selectedSection = this.listOfSections.find(s => s.id === sectionId);

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
              <div class="info-row"><strong>Class:</strong> ${this.batchCode.value || 'N/A'}</div>
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

    // Create CSV content with proper formatting for Excel
    const csvRows = [];

    // Add header information
    csvRows.push(['HILCoE School of Computer Science & Technology', '', '', '', '', '', '', '', '', '']);
    csvRows.push(['Result Submission Sheet', '', '', '', '', '', '', '', '', '']);
    csvRows.push([]); // Empty row
    csvRows.push(['Class:', this.batchCode.value || 'N/A', '', '', 'Section:', selectedSection?.sectionName || 'N/A']);
    csvRows.push(['Term:', `${this.getAcademicTermName(academicTerm)} ${year}`, '', '', 'Date of Submission:', new Date().toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' })]);
    csvRows.push(['Course Code:', selectedCourse?.courseCode || 'N/A', '', '', 'Signature:', '']);
    csvRows.push(['Instructor:', '', '', '', '', '']);
    csvRows.push([]); // Empty row

    // Create table headers
    const tableHeaders = ['Student Code', 'Full Name', 'Batch', '30%', '60%', '55%', '15%', 'Total(100%)', 'Grade', 'Remark'];
    csvRows.push(tableHeaders);

    // Add student data
    this.sectionAssignedStudents.forEach((student, index) => {
      const row = [
        student.studentCode,
        student.fullName,
        student.batchCode,
        '', // 30%
        '', // 60%
        '', // 55%
        '', // 15%
        '', // Total
        '', // Grade
        ''  // Remark
      ];
      csvRows.push(row);
    });

    // Convert to CSV string
    const csvContent = csvRows.map(row =>
      row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma or newline
        const escaped = cell.replace(/"/g, '""');
        return cell.includes(',') || cell.includes('\n') || cell.includes('"') ? `"${escaped}"` : escaped;
      }).join(',')
    ).join('\n');

    // Add BOM for Excel compatibility
    const BOM = '\uFEFF';
    const csvWithBOM = BOM + csvContent;

    // Create blob and download
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mark-list-${selectedCourse?.courseCode || 'course'}-${selectedSection?.sectionName || 'section'}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    this.notificationService.notification('success', 'Success', 'Mark list exported successfully');
  }

  search(): void {
    const filterFunc = (item: SectionAssignedStudentInfo) =>
      (this.searchValue ? item.fullName.toLowerCase().indexOf(this.searchValue.toLowerCase()) !== -1 : true);

    const data = this.listOfData.filter(item => filterFunc(item));
    this.listOfDisplayData = data;
  }



  /**
   * Get section color for tags
   */
  getSectionColor(section: string): string {
    const sectionColors: { [key: string]: string } = {
      'A': 'green',
      'B': 'blue',
      'C': 'orange',
      'D': 'purple',
      'E': 'cyan',
      'F': 'magenta',
      'G': 'red',
      'H': 'volcano',
      'I': 'gold',
      'J': 'lime'
    };

    return sectionColors[section] || 'default';
  }

  /**
   * Filter function for section dropdown
   */
  filterSectionOption = (input: string, option: any): boolean => {
    return option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0;
  };

  /**
   * Exports the attendance sheet as a PDF document optimized for printing
   * Opens the browser's print dialog for immediate printing
   * @returns void
   */
  public exportAttendanceSheetPDF(): void {
    try {
      if (this.sectionAssignedStudents.length === 0) {
        this.notificationService.notification('warning', 'Warning', 'No data to export');
        return;
      }

      // Get form values for header information
      const academicTerm = this.academicTerm.value;
      const year = this.year.value;
      const courseId = this.searchForm.get('courseId')?.value;
      const sectionId = this.searchForm.get('sectionId')?.value;

      // Get course and section information
      const selectedCourse = this.registeredCourses.find(c => c.courseId === courseId);
      const selectedSection = this.listOfSections.find(s => s.id === sectionId);

      // Create PDF in landscape mode
      const doc = new jsPDF('landscape', 'mm', 'a4');
    
    // Add professional header
    doc.setFontSize(17);
    doc.setFont('helvetica', 'bold');
    const pageWidth = doc.internal.pageSize.getWidth();
    const textWidth = doc.getTextWidth('HILCoE SCHOOL OF COMPUTER SCIENCE & TECHNOLOGY');
    const centerX = (pageWidth - textWidth) / 2;
    doc.text('HILCoE SCHOOL OF COMPUTER SCIENCE & TECHNOLOGY', centerX, 12);
    
    // Add decorative line
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    const lineLength = 150; // Length of the decorative line
    const lineStartX = (pageWidth - lineLength) / 2;
    doc.line(lineStartX, 14, lineStartX + lineLength, 14);
    
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('CLASS ATTENDANCE SHEET', 20, 20);
    
    // Add course information in a better distributed layout
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Left column - Course details
    doc.text(`Class: ${this.batchCode.value || 'N/A'}`, 20, 26);
    doc.text(`Term: ${this.getAcademicTermName(academicTerm)} ${year}`, 20, 30);
    doc.text(`Section: ${selectedSection?.sectionName || 'N/A'}`, 20, 34);
    
    // Middle column - Course code and instructor
    doc.text(`Course Code: ${selectedCourse?.courseCode || 'N/A'}`, 100, 26);
    doc.text(`Instructor: _________________`, 100, 31);
    
    // Right column - Date and signature
    doc.text(`Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' })}`, 180, 26);
    doc.text(`Signature: _________________`, 180, 31);

    // Prepare table data
    const tableData = this.sectionAssignedStudents.map((student, index) => [
      index + 1,
      student.fullName,
      student.batchCode,
      ...Array(24).fill('') // Empty cells for attendance marks
    ]);

    // Define table columns
    const columns = [
      { title: 'No.', dataKey: 'no', width: 16 },
      { title: 'Full Name', dataKey: 'name', width: 80 },
      { title: 'Batch', dataKey: 'batch', width: 30 },
      ...Array.from({ length: 24 }, (_, i) => ({ 
        title: `${i + 1}`, 
        dataKey: `day${i + 1}`, 
        width: 8 
      }))
    ];

    // Add table
    autoTable(doc, {
      head: [columns.map(col => col.title)],
      body: tableData,
      startY: 44,
      margin: { left: 2, right: 15, top: 20, bottom: 20 },
      pageBreak: 'auto',
      rowPageBreak: 'avoid',
      showHead: 'everyPage',
      styles: {
        fontSize: 10,
        cellPadding: 2,
        overflow: 'linebreak',
        halign: 'center',
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
        minCellHeight: 6,
        font: 'helvetica'
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
        fontSize: 10,
        cellPadding: 2,
        font: 'helvetica'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12 }, // No. (minimized slightly)
        1: { halign: 'left', cellWidth: 65, fontStyle: 'bold' },   // Name - Bold (added more width to prevent wrapping)
        2: { halign: 'center', cellWidth: 25, fontStyle: 'bold' }, // Batch - Bold
        // Attendance columns - increased width to prevent wrapping
        ...Object.fromEntries(
          Array.from({ length: 24 }, (_, i) => [i + 3, { halign: 'center', cellWidth: 8 }])
        )
      },
      bodyStyles: {
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
        fontSize: 10,
        cellPadding: 2,
        font: 'helvetica'
      },
      didDrawPage: (data: any) => {
        // Add page number
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.text(`Page ${data.pageNumber} of ${pageCount}`, 20, doc.internal.pageSize.height - 10);
      }
    });

    // Save the PDF and open print dialog
    const fileName = `attendance-sheet-${selectedCourse?.courseCode || 'course'}-${selectedSection?.sectionName || 'section'}-${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Generate PDF blob
    const pdfBlob = doc.output('blob');
    
    // Create object URL and open in new window for printing
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(pdfUrl, '_blank');
    
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
        // Clean up the URL after printing
        setTimeout(() => {
          URL.revokeObjectURL(pdfUrl);
        }, 1000);
      };
    } else {
      // Fallback: download the PDF if popup is blocked
      doc.save(fileName);
    }

    this.notificationService.notification('success', 'Success', 'Attendance sheet ready for printing');
    } catch (error) {
      this.notificationService.notification('error', 'Export Error', 'Failed to generate attendance sheet. Please try again.');
    }
  }

  /**
   * Exports the mark list as a PDF document optimized for printing
   * Opens the browser's print dialog for immediate printing
   * @returns void
   */
  public exportMarkListPDF(): void {
    try {
      if (this.sectionAssignedStudents.length === 0) {
        this.notificationService.notification('warning', 'Warning', 'No data to export');
        return;
      }

    // Get form values for header information
    const academicTerm = this.academicTerm.value;
    const year = this.year.value;
    const courseId = this.searchForm.get('courseId')?.value;
    const sectionId = this.searchForm.get('sectionId')?.value;

    // Get course and section information
    const selectedCourse = this.registeredCourses.find(c => c.courseId === courseId);
    const selectedSection = this.listOfSections.find(s => s.id === sectionId);

    // Create PDF in portrait mode
    const doc = new jsPDF('portrait', 'mm', 'a4');
    
    // Add professional header
    doc.setFontSize(17);
    doc.setFont('helvetica', 'bold');
    const pageWidth = doc.internal.pageSize.getWidth();
    const textWidth = doc.getTextWidth('HILCoE SCHOOL OF COMPUTER SCIENCE & TECHNOLOGY');
    const centerX = (pageWidth - textWidth) / 2;
    doc.text('HILCoE SCHOOL OF COMPUTER SCIENCE & TECHNOLOGY', centerX, 12);
    
    // Add decorative line
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    const lineLength = 150; // Length of the decorative line
    const lineStartX = (pageWidth - lineLength) / 2;
    doc.line(lineStartX, 14, lineStartX + lineLength, 14);
    
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('RESULT SUBMISSION SHEET', 20, 20);
    
    // Add course information in a better distributed layout
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Left column - Course details
    doc.text(`Class: ${this.batchCode.value || 'N/A'}`, 5, 26);
    doc.text(`Term: ${this.getAcademicTermName(academicTerm)} ${year}`, 5, 30);
    doc.text(`Course Code: ${selectedCourse?.courseCode || 'N/A'}`, 5, 34);
    
    // Middle column - Section and instructor
    doc.text(`Section: ${selectedSection?.sectionName || 'N/A'}`, 70, 26);
    doc.text(`Instructor: _________________`, 70, 31);
    
    // Right column - Date and signature
    doc.text(`Date of Submission: ${new Date().toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' })}`, 140, 26);
    doc.text(`Signature: _________________`, 140, 31);

    // Prepare table data
    const tableData = this.sectionAssignedStudents.map((student) => [
      student.studentCode,
      student.fullName,
      student.batchCode,
      '', // 30%
      '', // 60%
      '', // 55%
      '', // 15%
      '', // Total
      '', // Grade
      ''  // Remark
    ]);

    // Define table columns
    const columns = [
      { title: 'Student Code', dataKey: 'studentCode', width: 35 },
      { title: 'Full Name', dataKey: 'fullName', width: 60 },
      { title: 'Batch', dataKey: 'batch', width: 25 },
      { title: '30%', dataKey: 'score1', width: 20 },
      { title: '60%', dataKey: 'score2', width: 20 },
      { title: '55%', dataKey: 'score3', width: 20 },
      { title: '15%', dataKey: 'score4', width: 20 },
      { title: 'Total(100%)', dataKey: 'total', width: 25 },
      { title: 'Grade', dataKey: 'grade', width: 20 },
      { title: 'Remark', dataKey: 'remark', width: 25 }
    ];

    // Add table
    autoTable(doc, {
      head: [columns.map(col => col.title)],
      body: tableData,
      startY: 44,
      margin: { left: -2, right: 15, top: 20, bottom: 20 },
      pageBreak: 'auto',
      rowPageBreak: 'avoid',
      showHead: 'everyPage',
      styles: {
        fontSize: 10,
        cellPadding: 2,
        overflow: 'linebreak',
        halign: 'center',
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
        minCellHeight: 6,
        font: 'helvetica'
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
        fontSize: 10,
        cellPadding: 2,
        font: 'helvetica'
      },
      bodyStyles: {
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
        fontSize: 10,
        cellPadding: 2,
        font: 'helvetica'
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 25 },  // Student Code (reduced)
        1: { halign: 'left', cellWidth: 50, fontStyle: 'bold' },  // Full Name - Bold (further reduced)
        2: { halign: 'center', cellWidth: 25, fontStyle: 'bold' }, // Batch - Bold (reduced)
        3: { halign: 'center', cellWidth: 15 }, // 30% (reduced)
        4: { halign: 'center', cellWidth: 15 }, // 60% (reduced)
        5: { halign: 'center', cellWidth: 15 }, // 55% (reduced)
        6: { halign: 'center', cellWidth: 15 }, // 15% (reduced)
        7: { halign: 'center', cellWidth: 22 }, // Total (increased width to prevent wrapping)
        8: { halign: 'center', cellWidth: 15 }, // Grade (reduced)
        9: { halign: 'center', cellWidth: 18 }  // Remark (reduced)
      },
      didDrawPage: (data: any) => {
        // Add page number
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.text(`Page ${data.pageNumber} of ${pageCount}`, 20, doc.internal.pageSize.height - 10);
      }
    });

    // Save the PDF and open print dialog
    const fileName = `mark-list-${selectedCourse?.courseCode || 'course'}-${selectedSection?.sectionName || 'section'}-${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Generate PDF blob
    const pdfBlob = doc.output('blob');
    
    // Create object URL and open in new window for printing
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(pdfUrl, '_blank');
    
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
        // Clean up the URL after printing
        setTimeout(() => {
          URL.revokeObjectURL(pdfUrl);
        }, 1000);
      };
    } else {
      // Fallback: download the PDF if popup is blocked
      doc.save(fileName);
    }

    this.notificationService.notification('success', 'Success', 'Mark list ready for printing');
    } catch (error) {
      this.notificationService.notification('error', 'Export Error', 'Failed to generate mark list. Please try again.');
    }
  }
}