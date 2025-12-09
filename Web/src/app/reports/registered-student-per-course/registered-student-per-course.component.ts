import { Component, OnInit } from '@angular/core';
import { RegisteredStudentPerCourse } from '../model/registered-student-per-course.model';
import { ReportService } from '../services/report.service';
import { ExcelExportService } from '../services/excel-export.service';
import { PdfExportService } from '../services/pdf-export.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ACADEMIC_TERM_STATUS } from 'src/app/common/constant';
import { StaticData } from 'src/app/admission-request/model/StaticData';
import { CrudService } from 'src/app/services/crud.service';
import { SearchQueryParams } from '../SearchParam/search-query-params';
import { StudentInformation } from '../model/student-information.model';
import * as XLSX from 'xlsx';
import { TermCourseOfferingService } from 'src/app/colleges/services/term-course-offering.service';
@Component({
  selector: 'app-registered-student-per-course',
  templateUrl: './registered-student-per-course.component.html',
  styleUrls: ['./registered-student-per-course.component.scss']
})
export class RegisteredStudentPerCourseComponent implements OnInit {
  data: RegisteredStudentPerCourse;
  registeredStudentInformation: StudentInformation[] = [];
  isLoading = true;
  isFormCollapsed = false;
  hasSearched = false;
  formRegisteredStudentPerCourse: FormGroup;
  listOfTermNumber: StaticData[] = [];
  yearList: number[] = [];
  courses: any;
  pageIndex = 1;
  pageSize = 10;
  pageSizeOption = [5, 10, 15, 25, 50, 100];
  total = 0;
  searchKey = '';
  sortOrder = '';
  sortColumn = '';
  paginatedRegisteredStudent: StudentInformation[] = [];
  constructor(
    private _reportService: ReportService,
    private _excelExportService: ExcelExportService,
    private _pdfExportService: PdfExportService,
    private _fb: FormBuilder,
    private _crudService: CrudService,
    private _termCourseOfferingService: TermCourseOfferingService
  ) {
    const currentYear = new Date();
    this.yearList = this.getYearRange(currentYear.getFullYear());
    this.createCourseOffering();
    this.isLoading = false;
  }

  ngOnInit(): void {
    this.getListOfAcademicTermStatus();
    this.termId.valueChanges.subscribe(res => {
      if (res && this.termYear.value) {
        this.getListOfCourseOffering(res, this.termYear.value);
      }
    });

    // Subscribe to year changes
    this.termYear.valueChanges.subscribe(year => {
      if (year && this.termId.value) {
        this.getListOfCourseOffering(this.termId.value, year);
      }
    });
  }

  private createCourseOffering() {
    this.formRegisteredStudentPerCourse = this._fb.group({
      termId: [null, [Validators.required]],
      termYear: [null, [Validators.required]],
      courseId: [null, [Validators.required]]
    });
  }
  get termId() {
    return this.formRegisteredStudentPerCourse.get('termId');
  }
  get termYear() {
    return this.formRegisteredStudentPerCourse.get('termYear');
  }
  get courseId() {
    return this.formRegisteredStudentPerCourse.get('courseId');
  }
  getListOfCourseOffering(termId: number, termYear: number) {
    this.courses = null;
    if (termId && termYear) {
      this._termCourseOfferingService.getListOfCourseByAcademicTerm(termId, termYear)
        .subscribe({
          next: (res: any) => {
            this.courses = res;
            this.isLoading = false;
          },
          error: (err) => {
            console.error('Error fetching course offerings:', err);
            this.courses = [];
            this.isLoading = false;
          }
        });
    }
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
  getYearRange(currentYear: number): number[] {
    const startYear = 1998;
    const yearList = [];

    for (let year = startYear; year <= currentYear; year++) {
      yearList.push(year);
    }
    return yearList.reverse();
  }
  getRegisteredStudentPerCourse() {
    this.isLoading = true;
    this.hasSearched = true;
    const formModel = this.getStudentRegistered();
    this._reportService.getListOfRegisteredStudentPerCourse(formModel)
      .subscribe({
        next: (res: any) => {
          this.data = res;

          // Check if response exists and has data
          if (res && Array.isArray(res) && res.length > 0 && res[0] && res[0].studentInformation) {
            this.registeredStudentInformation = res[0].studentInformation;
            this.total = this.registeredStudentInformation.length;
          } else {
            // No data found
            this.registeredStudentInformation = [];
            this.total = 0;
            this.data = null;
          }

          this.updatePaginatedRegisteredStudent();
          this.isLoading = false;

          // Collapse the search form when results are returned
          this.isFormCollapsed = true;
        },
        error: (error) => {
          console.error('Error fetching registered students:', error);
          this.registeredStudentInformation = [];
          this.total = 0;
          this.data = null;
          this.updatePaginatedRegisteredStudent();
          this.isLoading = false;

          // Collapse the search form even on error
          this.isFormCollapsed = true;
        }
      });
  }
  exportToExcel(): void {
    // Check if data exists and has the required structure
    if (!this.data || !Array.isArray(this.data) || this.data.length === 0 || !this.data[0]) {
      console.error('No data available for export');
      return;
    }

    const term = this.data[0].academicTerm || 'N/A';
    const course = `${this.data[0].courseCode || 'N/A'} - ${this.data[0].courseTitle || 'N/A'}`;
    const studentData = this.data[0].studentInformation || [];

    const excelData = [
      [`Academic Term: ${term}`],
      [`Course: ${course}`],
      ["SerialNo", "StudentCode", "FullName", "BatchCode"],
      ...studentData.map(student => [
        student.serialNo || '',
        student.studentCode || '',
        student.fullName || '',
        student.batchCode || ''
      ])
    ];
    const merges: XLSX.Range[] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }
    ];

    this._excelExportService.exportWithCustomLayout(
      excelData,
      'Registered_Students',
      'Students',
      merges
    );
  }
  exportToPdf(): void {
    // Check if data exists and has the required structure
    if (!this.data || !Array.isArray(this.data) || this.data.length === 0 || !this.data[0]) {
      console.error('No data available for export');
      return;
    }

    const headerLines = [
      `Academic Term: ${this.data[0].academicTerm || 'N/A'}`,
      `Course: ${this.data[0].courseCode || 'N/A'} - ${this.data[0].courseTitle || 'N/A'}`
    ];

    const tableHeaders = ['Serial No', 'Student Code', 'Full Name', 'Batch Code'];
    const studentData = this.data[0].studentInformation || [];

    const tableData = studentData.map(student => [
      student.serialNo || '',
      student.studentCode || '',
      student.fullName || '',
      student.batchCode || ''
    ]);

    this._pdfExportService.exportToPdf(
      headerLines,
      tableHeaders,
      tableData,
      'Registered_Students_Report'
    );
  }
  getStudentRegistered(): SearchQueryParams {
    const formModel = this.formRegisteredStudentPerCourse.getRawValue();
    const params = new SearchQueryParams();
    params.termId = formModel.termId;
    params.termYear = formModel.termYear;
    params.courseId = formModel.courseId;
    return params;
  }
  updatePaginatedRegisteredStudent(): void {
    const startIndex = (this.pageIndex - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedRegisteredStudent = this.registeredStudentInformation.slice(startIndex, endIndex);
  }

  onPageIndexChange(page: number): void {
    this.pageIndex = page;
    this.updatePaginatedRegisteredStudent();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageIndex = 1;
    this.updatePaginatedRegisteredStudent();
  }

  onSort(sort: { key: string; value: string }): void {
    this.sortColumn = sort.key;
    this.sortOrder = sort.value;
    this.updatePaginatedRegisteredStudent();
  }

  loadData(): void {
    this.formRegisteredStudentPerCourse.reset();
    this.registeredStudentInformation = [];
    this.total = 0;
    this.pageIndex = 1;
    this.hasSearched = false;
    this.updatePaginatedRegisteredStudent();
  }
}
