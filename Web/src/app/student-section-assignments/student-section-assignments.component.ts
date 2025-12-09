import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BulkSectionAssignmentRequest, CourseSectionAssignmentRequest } from '../Models/BulkSectionAssignmentRequest';
import { StudentRegisteredCoursesResult, StudentRegisteredCoursesModel } from '../Models/StudentRegisteredCoursesModel';
import { StudentSectionAssignmentService } from '../services/student-section-assignment.service';
import { CustomNotificationService } from '../services/custom-notification.service';
import { ACADEMIC_TERM_STATUS } from '../common/constant';
import { TermCourseOfferingService } from '../colleges/services/term-course-offering.service';
import { StaticData } from '../admission-request/model/StaticData';
import { CourseSectionAssignment } from '../Models/CourseSectionAssignment';
import { NzModalService } from 'ng-zorro-antd/modal';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-student-section-assignments',
  templateUrl: './student-section-assignments.component.html',
  styleUrls: ['./student-section-assignments.component.scss']
})
export class StudentSectionAssignmentsComponent implements OnInit {
  // Component data
  registeredCourses: StudentRegisteredCoursesResult = { totalDistinctCount: 0, courses: [], numberOfGeneratedSections: 0, isSectionGenerated: false };
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
      this.studentSectionAssignmentService
        .getStudentRegisteredCourses(batchCode, academicTerm, year, 0)
        .subscribe({
          next: (res: StudentRegisteredCoursesResult) => {
            this.registeredCourses = res;
            this.loading = false;
            if (res.courses.length > 0) {
              this.numberOfSections = this.getCalculatedNumberOfSections();
              this.isSearchCollapsed = true;
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
    this.studentSectionAssignmentService.deleteStudentSectionAssignment(academicTerm, year, batchCode, 0).subscribe({
      next: (res) => {
        this.successMessage = 'Successfully removed generated section assignments.';
        this.registeredCourses.isSectionGenerated = false;
        this.registeredCourses.numberOfGeneratedSections = 0;
        this.numberOfSections = this.getCalculatedNumberOfSections();
      },
      error: (error) => {
        this.errorMessage = 'Error removing generated section assignments. Please try again.';
        console.error('Error removing section assignments:', error);
      }
    });
  }

  /**
   * Clear the search results
   */
  clearSearch(): void {
    this.registeredCourses = { totalDistinctCount: 0, courses: [], numberOfGeneratedSections: 0, isSectionGenerated: false };
    this.errorMessage = '';
    this.successMessage = '';
    this.searchForm.reset();
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
   * Get the currently selected default course
   */
  getDefaultCourse(): StudentRegisteredCoursesModel | null {
    return this.registeredCourses.courses.find(course => course.isDefaultSection) || null;
  }

  /**
   * Check if any course is selected as default
   */
  hasDefaultCourse(): boolean {
    return this.registeredCourses.courses.some(course => course.isDefaultSection);
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
    if (isDefault) {
      // If user is trying to set this course as default, uncheck all other courses first
      this.registeredCourses.courses.forEach(c => {
        if (c !== course) {
          c.isDefaultSection = false;
        }
      });
      course.isDefaultSection = true;
    } else {
      // If user is unchecking, just set to false
      course.isDefaultSection = false;
    }
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

    // Validate that only one course is selected as default
    const defaultCourses = this.registeredCourses.courses.filter(course => course.isDefaultSection);
    if (defaultCourses.length > 1) {
      this.errorMessage = 'Only one course can be selected as the default section. Please review your selection.';
      return;
    }

    // Clear previous messages and start loading
    this.generatingAssignments = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    // Show initial loading message
    console.log('Starting section assignment generation...');

    const { academicTerm, year, batchCode } = this.searchForm.value;

    const courseAssignments: CourseSectionAssignment[] = this.registeredCourses.courses.map(course => ({
      courseId: course.courseId,
      maxStudentsPerSection: course.maxStudentsPerSection,
      useDefaultSection: course.isDefaultSection,
      defaultSectionId: course.isDefaultSection ? 1 : undefined,
      numberOfSections: course.numberOfSections,
      isDefaultSection: course.isDefaultSection
    }));

    const request: CourseSectionAssignmentRequest = {
      batchCode: batchCode,
      academicTerm: academicTerm,
      year: year,
      numberOfSections: this.numberOfSections,
      courseAssignments: courseAssignments
    };

    // Validate that we have course assignments data
    if (!request.courseAssignments || request.courseAssignments.length === 0) {
      this.errorMessage = 'No course assignments data available.';
      this.generatingAssignments = false;
      return;
    }

    console.log('Generating student course section assignments with request: ', request);

    // Call the API to generate student course section assignments
    this.studentSectionAssignmentService.assignStudentsToSections(request).subscribe({
      next: (response) => {
        this.generatingAssignments = false;
        
        // Create detailed success message
        const totalStudents = this.getTotalStudents();
        this.successMessage = `✅ Successfully generated section assignments! 
          ${this.registeredCourses.courses.length} courses processed, 
          ${this.numberOfSections} sections created, 
          ${totalStudents} students assigned (approximately ${Math.ceil(totalStudents / this.numberOfSections)} students per section)`;
        
        // Update the section generation status
        this.registeredCourses.isSectionGenerated = true;
        this.registeredCourses.numberOfGeneratedSections = this.numberOfSections;
        
        console.log('Section assignments generated successfully:', response);
        
        // Auto-hide success message after 8 seconds
        setTimeout(() => {
          if (this.successMessage.includes('✅ Successfully generated')) {
            this.successMessage = '';
          }
        }, 8000);
      },
      error: (error) => {
        this.generatingAssignments = false;
        
        // Create detailed error message
        let errorMsg = 'Error generating section assignments. ';
        if (error.status === 400) {
          errorMsg += 'Invalid request data. Please check your input and try again.';
        } else if (error.status === 500) {
          errorMsg += 'Server error. Please try again later or contact support.';
        } else if (error.status === 0) {
          errorMsg += 'Network error. Please check your connection and try again.';
        } else {
          errorMsg += 'Please try again.';
        }
        
        this.errorMessage = errorMsg;
        console.error('Error generating section assignments:', error);
        
        // Auto-hide error message after 10 seconds
        setTimeout(() => {
          if (this.errorMessage === errorMsg) {
            this.errorMessage = '';
          }
        }, 10000);
      }
    });
  }

  /**
   * Download the current section assignment data as PDF in landscape orientation
   */
  downloadAsPDF(): void {
    if (this.registeredCourses.courses.length === 0) {
      this.errorMessage = 'No data available to generate PDF report.';
      return;
    }

    try {
      // Create new PDF document in landscape orientation
      const doc = new jsPDF('landscape', 'mm', 'a4');
      
      // Set up fonts and colors
      doc.setFont('helvetica');
      
      // Add header
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Header background
      doc.setFillColor(41, 128, 185); // Blue background
      doc.rect(0, 0, pageWidth, 25, 'F');
      
      // Header text
      doc.setTextColor(255, 255, 255); // White text
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Course Section Assignment Report', pageWidth / 2, 12, { align: 'center' });
      
      // Subtitle
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Student Registration Summary', pageWidth / 2, 18, { align: 'center' });
      
      // Reset text color
      doc.setTextColor(0, 0, 0);
      
      // Add report details
      let yPosition = 35;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      
      // Report metadata
      const { academicTerm, year, batchCode } = this.searchForm.value;
      const termName = this.getAcademicTermName(academicTerm);
      const currentDate = new Date().toLocaleDateString();
      
      doc.text(`Academic Term: ${termName} ${year}`, 20, yPosition);
      doc.text(`Batch Code: ${batchCode}`, pageWidth - 20, yPosition, { align: 'right' });
      
      yPosition += 8;
      doc.text(`Generated On: ${currentDate}`, 20, yPosition);
      doc.text(`Total Students: ${this.getTotalStudents()}`, pageWidth - 20, yPosition, { align: 'right' });
      
      yPosition += 8;
      doc.text(`Total Courses: ${this.getTotalCourses()}`, 20, yPosition);
      doc.text(`Number of Sections: ${this.numberOfSections}`, pageWidth - 20, yPosition, { align: 'right' });
      
      yPosition += 15;
      
      // Prepare table data
      const tableData = this.registeredCourses.courses.map((course, index) => [
        index + 1,
        course.courseCode,
        course.courseTitle,
        course.numberOfStudents.toString(),
        course.isDefaultSection ? 'Yes' : 'No',
        course.numberOfSections.toString()
      ]);
      
      // Create table
      (doc as any).autoTable({
        head: [['#', 'Course Code', 'Course Title', 'Students', 'Default Section', 'Sections']],
        body: tableData,
        startY: yPosition,
        styles: {
          fontSize: 9,
          cellPadding: 3,
          overflow: 'linebreak',
          halign: 'left'
        },
        headStyles: {
          fillColor: [52, 73, 94], // Dark blue-gray
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245] // Light gray
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 15 }, // #
          1: { halign: 'center', cellWidth: 30 }, // Course Code
          2: { cellWidth: 80 }, // Course Title
          3: { halign: 'center', cellWidth: 25 }, // Students
          4: { halign: 'center', cellWidth: 30 }, // Default Section
          5: { halign: 'center', cellWidth: 25 }  // Sections
        },
        margin: { left: 20, right: 20 },
        tableWidth: 'auto'
      });
      
      // Add footer
      const finalY = (doc as any).lastAutoTable.finalY || yPosition + 50;
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text('This report was generated automatically by the Student Section Assignment System.', 
               20, finalY + 15);
      doc.text(`Page 1 of 1`, pageWidth - 20, finalY + 15, { align: 'right' });
      
      // Generate filename
      const filename = `Section_Assignment_Report_${batchCode}_${termName}_${year}_${currentDate.replace(/\//g, '-')}.pdf`;
      
      // Save the PDF
      doc.save(filename);
      
      // Show success message
      this.successMessage = 'PDF report downloaded successfully!';
      
      // Auto-hide success message
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      this.errorMessage = 'Error generating PDF report. Please try again.';
    }
  }

  /**
   * Export the current section assignment data to Excel
   */
  exportToExcel(): void {
    if (this.registeredCourses.courses.length === 0) {
      this.errorMessage = 'No data available to export to Excel.';
      return;
    }

    try {
      // Prepare data for Excel export
      const exportData = this.registeredCourses.courses.map((course, index) => ({
        '#': index + 1,
        'Course Code': course.courseCode,
        'Course Title': course.courseTitle,
        'Number of Students': course.numberOfStudents,
        'Default Section': course.isDefaultSection ? 'Yes' : 'No',
        'Number of Sections': course.numberOfSections,
        'Max Students Per Section': course.maxStudentsPerSection
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const colWidths = [
        { wch: 5 },   // #
        { wch: 15 },  // Course Code
        { wch: 40 },  // Course Title
        { wch: 18 },  // Number of Students
        { wch: 18 },  // Default Section
        { wch: 20 },  // Number of Sections
        { wch: 25 }   // Max Students Per Section
      ];
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Section Assignments');

      // Generate filename
      const { academicTerm, year, batchCode } = this.searchForm.value;
      const termName = this.getAcademicTermName(academicTerm);
      const currentDate = new Date().toLocaleDateString();
      const filename = `Section_Assignment_Report_${batchCode}_${termName}_${year}_${currentDate.replace(/\//g, '-')}.xlsx`;

      // Save the file
      XLSX.writeFile(wb, filename);

      // Show success message
      this.successMessage = 'Excel file exported successfully!';
      
      // Auto-hide success message
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);

    } catch (error) {
      console.error('Error exporting to Excel:', error);
      this.errorMessage = 'Error exporting to Excel. Please try again.';
    }
  }

  /**
   * Export the current section assignment data to CSV
   */
  exportToCSV(): void {
    if (this.registeredCourses.courses.length === 0) {
      this.errorMessage = 'No data available to export to CSV.';
      return;
    }

    try {
      // Prepare CSV headers
      const headers = ['#', 'Course Code', 'Course Title', 'Number of Students', 'Default Section', 'Number of Sections', 'Max Students Per Section'];
      
      // Prepare CSV data
      const csvData = this.registeredCourses.courses.map((course, index) => [
        index + 1,
        course.courseCode,
        course.courseTitle,
        course.numberOfStudents,
        course.isDefaultSection ? 'Yes' : 'No',
        course.numberOfSections,
        course.maxStudentsPerSection
      ]);

      // Convert to CSV format
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Generate filename
      const { academicTerm, year, batchCode } = this.searchForm.value;
      const termName = this.getAcademicTermName(academicTerm);
      const currentDate = new Date().toLocaleDateString();
      const filename = `Section_Assignment_Report_${batchCode}_${termName}_${year}_${currentDate.replace(/\//g, '-')}.csv`;

      // Save the file
      saveAs(blob, filename);

      // Show success message
      this.successMessage = 'CSV file exported successfully!';
      
      // Auto-hide success message
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);

    } catch (error) {
      console.error('Error exporting to CSV:', error);
      this.errorMessage = 'Error exporting to CSV. Please try again.';
    }
  }
} 