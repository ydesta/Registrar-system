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
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

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
  private getInstructorName(): string {
    const staffName = this.staff ? `${this.staff.firstName ?? ''} ${this.staff.lastName ?? ''}`.trim() : '';
    if (staffName) {
      return staffName;
    }
    const firstName = (localStorage.getItem('firstName') || '').trim();
    const lastName = (localStorage.getItem('lastName') || '').trim();
    return `${firstName} ${lastName}`.trim();
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
    if (
      this.staff?.id &&
      academicTerm != null &&
      this.year?.value != null &&
      sectionType != null
    ) {
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

    const academicTerm = this.form.get('academicTerm')?.value;
    const year = this.form.get('year')?.value;
    const courseId = this.form.get('courseId')?.value;
    const sectionId = this.form.get('sectionId')?.value;

    const selectedCourse = this.courseList.find(c => c.id === courseId);
    const selectedSection = this.availableSections.find(s => s.id === sectionId);
    const instructorName = this.getInstructorName();

    const days = Array.from({ length: 24 }, (_, i) => `${i + 1}`);
    const aoa: (string | number)[][] = [];

    aoa.push(['HILCoE School of Computer Science & Technology']);
    aoa.push(['Class Attendance Sheet']);
    aoa.push([]);
    aoa.push(['Class:', this.form.get('batchId')?.value || 'N/A']);
    aoa.push(['Term:', `${this.getAcademicTermName(academicTerm)} ${year}`]);
    aoa.push(['Section:', selectedSection?.sectionName || 'N/A']);
    aoa.push(['Course Code:', selectedCourse?.courseCode || 'N/A']);
    aoa.push(['Instructor:', instructorName || '_________________']);
    aoa.push([]);

    aoa.push(['No.', 'Name', 'Batch', ...days]);
    this.sectionAssignedStudents.forEach((student, index) => {
      aoa.push([index + 1, student.fullName, student.batchCode, ...Array(24).fill('')]);
    });

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 32 },
      { wch: 14 },
      ...Array.from({ length: 24 }, () => ({ wch: 4 }))
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');

    const fileName = `attendance-sheet-${selectedCourse?.courseCode || 'course'}-${selectedSection?.sectionName || 'section'}-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);

    this.notificationService.notification('success', 'Success', 'Attendance sheet exported successfully');
  }

  exportMarkList(): void {
    if (this.sectionAssignedStudents.length === 0) {
      this.notificationService.notification('warning', 'Warning', 'No data to export');
      return;
    }

    const academicTerm = this.form.get('academicTerm')?.value;
    const year = this.form.get('year')?.value;
    const courseId = this.form.get('courseId')?.value;
    const sectionId = this.form.get('sectionId')?.value;

    const selectedCourse = this.courseList.find(c => c.id === courseId);
    const selectedSection = this.availableSections.find(s => s.id === sectionId);
    const instructorName = this.getInstructorName();

    const submissionDate = new Date().toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' });
    const aoa: (string | number)[][] = [];

    aoa.push(['HILCoE School of Computer Science & Technology']);
    aoa.push(['Result Submission Sheet']);
    aoa.push([]);
    aoa.push(['Class:', this.form.get('batchId')?.value || 'N/A', '', '', 'Section:', selectedSection?.sectionName || 'N/A']);
    aoa.push(['Term:', `${this.getAcademicTermName(academicTerm)} ${year}`, '', '', 'Date of Submission:', submissionDate]);
    aoa.push(['Course Code:', selectedCourse?.courseCode || 'N/A', '', '', 'Signature:', '_________________']);
    aoa.push(['Instructor:', instructorName || '_________________']);
    aoa.push([]);

    aoa.push(['Student Code', 'Full Name', 'Batch', '30%', '60%', '55%', '15%', 'Total(100%)', 'Grade', 'Remark']);
    this.sectionAssignedStudents.forEach(student => {
      aoa.push([student.studentCode, student.fullName, student.batchCode, '', '', '', '', '', '', '']);
    });

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [
      { wch: 16 },
      { wch: 32 },
      { wch: 14 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 12 },
      { wch: 10 },
      { wch: 14 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mark List');

    const fileName = `mark-list-${selectedCourse?.courseCode || 'course'}-${selectedSection?.sectionName || 'section'}-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);

    this.notificationService.notification('success', 'Success', 'Mark list exported successfully');
  }

  public exportAttendanceSheetPDF(): void {
    try {
      if (this.sectionAssignedStudents.length === 0) {
        this.notificationService.notification('warning', 'Warning', 'No data to export');
        return;
      }

      const academicTerm = this.form.get('academicTerm')?.value;
      const year = this.form.get('year')?.value;
      const courseId = this.form.get('courseId')?.value;
      const sectionId = this.form.get('sectionId')?.value;

      const selectedCourse = this.courseList.find(c => c.id === courseId);
      const selectedSection = this.availableSections.find(s => s.id === sectionId);
      const instructorName = this.getInstructorName();

      const doc = new jsPDF('landscape', 'mm', 'a4');

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      const pageWidth = doc.internal.pageSize.getWidth();
      const textWidth = doc.getTextWidth('HILCoE SCHOOL OF COMPUTER SCIENCE & TECHNOLOGY');
      const centerX = (pageWidth - textWidth) / 2;
      doc.text('HILCoE SCHOOL OF COMPUTER SCIENCE & TECHNOLOGY', centerX, 12);

      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      const lineLength = 150;
      const lineStartX = (pageWidth - lineLength) / 2;
      doc.line(lineStartX, 14, lineStartX + lineLength, 14);

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('CLASS ATTENDANCE SHEET', 20, 20);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Class: ${this.form.get('batchId')?.value || 'N/A'}`, 20, 26);
      doc.text(`Term: ${this.getAcademicTermName(academicTerm)} ${year}`, 20, 29);
      doc.text(`Section: ${selectedSection?.sectionName || 'N/A'}`, 20, 32);
      doc.text(`Course Code: ${selectedCourse?.courseCode || 'N/A'}`, 20, 35);
      doc.text(`Instructor: ${instructorName || '_________________'}`, 20, 38);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' })}`,
        120,
        30
      );
      doc.text('Signature: _________________', 120, 35);

      const tableData = this.sectionAssignedStudents.map((student, index) => [
        index + 1,
        student.fullName,
        student.batchCode,
        ...Array(24).fill('')
      ]);

      const columns = [
        { title: 'No.', dataKey: 'no', width: 15 },
        { title: 'Full Name', dataKey: 'name', width: 80 },
        { title: 'Batch', dataKey: 'batch', width: 30 },
        ...Array.from({ length: 24 }, (_, i) => ({
          title: `${i + 1}`,
          dataKey: `day${i + 1}`,
          width: 8
        }))
      ];

      autoTable(doc, {
        head: [columns.map(col => col.title)],
        body: tableData,
        startY: 44,
        margin: { left: 15, right: 15, top: 20, bottom: 20 },
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
          0: { halign: 'center', cellWidth: 12 },
          1: { halign: 'left', cellWidth: 60, fontStyle: 'bold' },
          2: { halign: 'center', cellWidth: 25, fontStyle: 'bold' },
          ...Object.fromEntries(
            Array.from({ length: 24 }, (_, i) => [i + 3, { halign: 'center', cellWidth: 6 }])
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
          const pageCount = doc.getNumberOfPages();
          doc.setFontSize(8);
          doc.text(`Page ${data.pageNumber} of ${pageCount}`, 20, doc.internal.pageSize.height - 10);
        }
      });

      const fileName = `attendance-sheet-${selectedCourse?.courseCode || 'course'}-${selectedSection?.sectionName || 'section'}-${new Date().toISOString().split('T')[0]}.pdf`;
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(pdfUrl, '_blank');

      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
          setTimeout(() => {
            URL.revokeObjectURL(pdfUrl);
          }, 1000);
        };
      } else {
        doc.save(fileName);
      }

      this.notificationService.notification('success', 'Success', 'Attendance sheet ready for printing');
    } catch (error) {
      this.notificationService.notification('error', 'Export Error', 'Failed to generate attendance sheet. Please try again.');
    }
  }
}
