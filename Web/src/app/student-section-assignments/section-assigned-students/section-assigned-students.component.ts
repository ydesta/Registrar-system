import { Component, OnDestroy, OnInit } from '@angular/core';
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
import * as XLSX from 'xlsx';
import { PaginatorService, ServerPaginator } from 'src/app/reports/services/paginator.service';

@Component({
  selector: 'app-section-assigned-students',
  templateUrl: './section-assigned-students.component.html',
  styleUrls: ['./section-assigned-students.component.scss']
})
export class SectionAssignedStudentsComponent implements OnInit, OnDestroy {
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
  hasSearched = false;
  pager: ServerPaginator;
  constructor(
    private fb: FormBuilder,
    private studentSectionAssignmentService: StudentSectionAssignmentService,
    private notificationService: CustomNotificationService,
    private courseTermOfferingService: TermCourseOfferingService,
    private paginator: PaginatorService
  ) {
    this.pager = this.paginator.create();
    const currentYear = new Date().getFullYear();
    this.yearList = this.getYearRange(currentYear);
    this.getListOfAcademicTermStatus();
    this.createSearchForm();
  }
  private getInstructorName(): string {
    const firstName = (localStorage.getItem('firstName') || '').trim();
    const lastName = (localStorage.getItem('lastName') || '').trim();
    return `${firstName} ${lastName}`.trim();
  }

  ngOnInit(): void {
    this.pager.init(() => this.searchSectionAssignedStudents(false));
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

  ngOnDestroy(): void {
    this.pager.destroy();
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

  searchSectionAssignedStudents(resetPage = true): void {
    if (!this.searchForm.valid) {
      this.notificationService.notification('error', 'Validation Error', 'Please fill in all required fields.');
      return;
    }
    if (resetPage) {
      this.pager.pageIndex = 1;
    }
    this.loading = true;
    this.pager.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.hasSearched = true;
    const { batchCode, academicTerm, year, sectionType, courseId, sectionId } = this.searchForm.value;
    this.studentSectionAssignmentService
      .getListOfSectionAssignedStudentsPaginated(
        batchCode,
        academicTerm,
        year,
        this.pager.query({
          sectionType,
          courseId: courseId || null,
          sectionId: sectionId || null
        })
      )
      .subscribe({
        next: (res: any) => {
          this.sectionAssignedStudents = res.data || [];
          this.listOfData = [...this.sectionAssignedStudents];
          this.listOfDisplayData = [...this.sectionAssignedStudents];
          this.pager.applyResult(res);
          this.successMessage = `Found ${this.pager.total} section assigned students`;
          this.isSearchCollapsed = true;
          this.loading = false;
        },
        error: () => {
          this.sectionAssignedStudents = [];
          this.listOfDisplayData = [];
          this.pager.fail();
          this.loading = false;
          this.errorMessage = 'Error retrieving section assigned students. Please try again.';
          this.notificationService.notification('error', 'Error', this.errorMessage);
        }
      });
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
    this.hasSearched = false;
    this.pager.pageIndex = 1;
    this.pager.total = 0;
    this.pager.searchKey = '';
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

    const academicTerm = this.academicTerm.value;
    const year = this.year.value;
    const courseId = this.searchForm.get('courseId')?.value;
    const sectionId = this.searchForm.get('sectionId')?.value;

    const selectedCourse = this.registeredCourses.find(c => c.courseId === courseId);
    const selectedSection = this.listOfSections.find(s => s.id === sectionId);
    const instructorName = this.getInstructorName();

    const days = Array.from({ length: 24 }, (_, i) => `${i + 1}`);
    const aoa: (string | number)[][] = [];

    aoa.push(['HILCoE School of Computer Science & Technology']);
    aoa.push(['Class Attendance Sheet']);
    aoa.push([]);
    aoa.push(['Class:', this.batchCode.value || 'N/A']);
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

    const academicTerm = this.academicTerm.value;
    const year = this.year.value;
    const courseId = this.searchForm.get('courseId')?.value;
    const sectionId = this.searchForm.get('sectionId')?.value;

    const selectedCourse = this.registeredCourses.find(c => c.courseId === courseId);
    const selectedSection = this.listOfSections.find(s => s.id === sectionId);
    const instructorName = this.getInstructorName();
    const submissionDate = new Date().toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' });

    const aoa: (string | number)[][] = [];
    aoa.push(['HILCoE School of Computer Science & Technology']);
    aoa.push(['Result Submission Sheet']);
    aoa.push([]);
    aoa.push(['Class:', this.batchCode.value || 'N/A', '', '', 'Section:', selectedSection?.sectionName || 'N/A']);
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

  search(): void {
    this.pager.onSearch(this.searchValue);
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

  public exportAttendanceSheetPDF(): void {
    try {
      if (this.sectionAssignedStudents.length === 0) {
        this.notificationService.notification('warning', 'Warning', 'No data to export');
        return;
      }

      const academicTerm = this.academicTerm.value;
      const year = this.year.value;
      const courseId = this.searchForm.get('courseId')?.value;
      const sectionId = this.searchForm.get('sectionId')?.value;

      const selectedCourse = this.registeredCourses.find(c => c.courseId === courseId);
      const selectedSection = this.listOfSections.find(s => s.id === sectionId);
      const instructorName = this.getInstructorName();

      const doc = new jsPDF('landscape', 'mm', 'a4');

      doc.setFontSize(17);
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

      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('CLASS ATTENDANCE SHEET', 20, 20);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      doc.text(`Class: ${this.batchCode.value || 'N/A'}`, 20, 26);
      doc.text(`Term: ${this.getAcademicTermName(academicTerm)} ${year}`, 20, 30);
      doc.text(`Section: ${selectedSection?.sectionName || 'N/A'}`, 20, 34);

      doc.text(`Course Code: ${selectedCourse?.courseCode || 'N/A'}`, 100, 26);
      doc.text(`Instructor: ${instructorName || '_________________'}`, 100, 31);

      doc.text(
        `Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' })}`,
        180,
        26
      );
      doc.text('Signature: _________________', 180, 31);

      const tableData = this.sectionAssignedStudents.map((student, index) => [
        index + 1,
        student.fullName,
        student.batchCode,
        ...Array(24).fill('')
      ]);

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
          0: { halign: 'center', cellWidth: 12 },
          1: { halign: 'left', cellWidth: 65, fontStyle: 'bold' },
          2: { halign: 'center', cellWidth: 25, fontStyle: 'bold' },
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