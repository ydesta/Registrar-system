import { Component, OnInit } from '@angular/core';
import { ExcelExportService } from '../services/excel-export.service';
import { PdfExportService } from '../services/pdf-export.service';
import { ReportService } from '../services/report.service';
import { RegisteredStudentPerBatch } from '../model/registered-student-per-batch.model';
import { BatchService } from 'src/app/colleges/services/batch.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SearchQueryParams } from '../SearchParam/search-query-params';
import { StaticData } from 'src/app/admission-request/model/StaticData';
import { ACADEMIC_TERM_STATUS } from 'src/app/common/constant';
import { CrudService } from 'src/app/services/crud.service';
import * as XLSX from 'xlsx';
import { StudentInformation } from '../model/student-information.model';
import { TermCourseOfferingService } from 'src/app/colleges/services/term-course-offering.service';
@Component({
  selector: 'app-registered-student-per-batch',
  templateUrl: './registered-student-per-batch.component.html',
  styleUrls: ['./registered-student-per-batch.component.scss']
})
export class RegisteredStudentPerBatchComponent implements OnInit {
  data: RegisteredStudentPerBatch;
  registeredStudentInformation: StudentInformation[] = [];
  paginatedRegisteredStudent: StudentInformation[] = [];
  isLoading = false;
  isFormCollapsed = false;
  hasSearched = false;
  formRegisteredStudentPerBatch: FormGroup;
  listOfBatch: any[] = [];
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
  constructor(
    private _reportService: ReportService,
    private _excelExportService: ExcelExportService,
    private _pdfExportService: PdfExportService,
    private _batchService: BatchService,
    private _fb: FormBuilder,
    private _crudService: CrudService,
    private courseTermOfferingService: TermCourseOfferingService,
  ) {
    const currentYear = new Date();
    this.yearList = this.getYearRange(currentYear.getFullYear());
    this.createRegisteredStudentPerBatch();
  }

  ngOnInit(): void {
    this.termId.valueChanges.subscribe(res => {
      if (res && this.termYear.value) {
        this.getListOfCourseOffering(res, this.termYear.value);
        this.getListOfBatch(res, this.termYear.value);
      }
    });
    // Subscribe to year changes
    this.termYear.valueChanges.subscribe(year => {
      if (year && this.termId.value) {
        this.getListOfCourseOffering(this.termId.value, year);
        this.getListOfBatch(this.termId.value, year);
      }
    });
    this.batchCode.valueChanges.subscribe(res => {
      console.log("$$       ",res);
      if (this.termYear.value && this.termId.value && res) {
        this.getListOfCourseOffering(this.termId.value, this.termYear.value, res);
      }
    });
    // this.
    // ();
    this.getListOfAcademicTermStatus();
    // this._crudService.getList("/courses").subscribe((res: any) => {
    //   this.courses = res.data;
    // });
  }
  private createRegisteredStudentPerBatch() {
    this.formRegisteredStudentPerBatch = this._fb.group({
      termId: [null, [Validators.required]],
      termYear: [null, [Validators.required]],
      courseId: [null, []],
      batchCode: [null, [Validators.required]],
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
  getYearRange(currentYear: number): number[] {
    const startYear = 1998;
    const yearList = [];
    for (let year = startYear; year <= currentYear; year++) {
      yearList.push(year);
    }
    return yearList.reverse();
  }
  // getListOfBatch() {
  //   this._batchService.getBatchList().subscribe(res => {
  //     this.listOfBatch = res.data;
  //   })
  // }
  getListOfBatch(termId: number = 0, termYear: number = 0) {
    this.courseTermOfferingService.getListOfBatchCodeByAcademicTerm(termId, termYear).subscribe(res => {
      this.listOfBatch = res;
    });
  }
  getRegisteredStudentPerBatch() {
    this.isLoading = true;
    this.hasSearched = true;
    const formModel = this.getStudentRegistered();
    this._reportService.getListOfRegisteredStudentPerBatch(formModel)
      .subscribe((res: any) => {
        this.data = res;
        this.registeredStudentInformation = this.data[0]?.studentInformation;;
        this.total = this.registeredStudentInformation.length;
        this.updatePaginatedRegisteredStudent();
        this.isLoading = false;
      });
  }

  loadData() {
    this.formRegisteredStudentPerBatch.reset();
    this.registeredStudentInformation = [];
    this.paginatedRegisteredStudent = [];
    this.total = 0;
    this.hasSearched = false;
    this.isFormCollapsed = true;
  }
  getStudentRegistered(): SearchQueryParams {
    const formModel = this.formRegisteredStudentPerBatch.getRawValue();
    const params = new SearchQueryParams();
    params.termId = formModel.termId;
    params.termYear = formModel.termYear;
    params.courseId = formModel.courseId;
    params.batchCode = formModel.batchCode;
    return params;
  }
  get termId() {
    return this.formRegisteredStudentPerBatch.get("termId");
  }
  get termYear() {
    return this.formRegisteredStudentPerBatch.get("termYear");
  }
  get batchCode() {
    return this.formRegisteredStudentPerBatch.get("batchCode");
  }
  exportToExcel(): void {
    // Check if data exists and has the required structure
    if (!this.data || !Array.isArray(this.data) || this.data.length === 0) {
      console.error('No data available for export');
      return;
    }

    const firstDataItem = this.data[0];
    if (!firstDataItem) {
      console.error('Invalid data structure for export');
      return;
    }

    // Get form values to determine course information
    const formValues = this.formRegisteredStudentPerBatch.getRawValue();
    const selectedCourseId = formValues.courseId;

    // Safely extract data with fallbacks
    const term = firstDataItem.academicTerm || 'N/A';
    const batch = firstDataItem.batchCode || 'N/A';

    // Determine course information
    let courseInfo = 'All Courses';
    if (selectedCourseId && this.courses) {
      // Find the selected course from the dropdown
      const selectedCourse = this.courses.find(course => course.courseId === selectedCourseId);
      if (selectedCourse) {
        courseInfo = `${selectedCourse.courseCode} - ${selectedCourse.courseTitle}`;
      }
    } else if (firstDataItem.courseCode && firstDataItem.courseTitle) {
      // Use course info from API response if available
      courseInfo = `${firstDataItem.courseCode} - ${firstDataItem.courseTitle}`;
    }

    // Check if student information exists
    const studentInfo = firstDataItem.studentInformation || [];
    if (!Array.isArray(studentInfo) || studentInfo.length === 0) {
      console.warn('No student information available for export');
    }

    const excelData = [
      [`Academic Term: ${term}`],
      [`Course: ${courseInfo}`],
      [`Batch Code: ${batch}`],
      ["Serial No", "Course Code", "Course Title", "Student Code", "Full Name"],
      ...studentInfo.map(student => [
        student.serialNo || 'N/A',
        student.courseCode || 'N/A',
        student.courseTitle || 'N/A',
        student.studentCode || 'N/A',
        student.fullName || 'N/A'
      ])
    ];

    const merges: XLSX.Range[] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } }
    ];

    this._excelExportService.exportWithCustomLayout(
      excelData,
      'Registered_Students_Per_Batch_Report',
      'Students',
      merges
    );
  }
  exportToPdf(): void {
    // Check if data exists and has the required structure
    if (!this.data || !Array.isArray(this.data) || this.data.length === 0) {
      console.error('No data available for PDF export');
      return;
    }

    const firstDataItem = this.data[0];
    if (!firstDataItem) {
      console.error('Invalid data structure for PDF export');
      return;
    }

    // Get form values to determine course information
    const formValues = this.formRegisteredStudentPerBatch.getRawValue();
    const selectedCourseId = formValues.courseId;

    // Safely extract data with fallbacks
    const term = firstDataItem.academicTerm || 'N/A';
    const batch = firstDataItem.batchCode || 'N/A';

    // Determine course information
    let courseInfo = 'All Courses';
    if (selectedCourseId && this.courses) {
      // Find the selected course from the dropdown
      const selectedCourse = this.courses.find(course => course.courseId === selectedCourseId);
      if (selectedCourse) {
        courseInfo = `${selectedCourse.courseCode} - ${selectedCourse.courseTitle}`;
      }
    } else if (firstDataItem.courseCode && firstDataItem.courseTitle) {
      // Use course info from API response if available
      courseInfo = `${firstDataItem.courseCode} - ${firstDataItem.courseTitle}`;
    }

    const headerLines = [
      `Academic Term: ${term}`,
      `Course: ${courseInfo}`,
      `Batch Code: ${batch}`
    ];

    const tableHeaders = ['Serial No', 'Course Code', 'Course Title', 'Student Code', 'Full Name'];

    // Check if student information exists
    const studentInfo = firstDataItem.studentInformation || [];
    const tableData = studentInfo.map(student => [
      student.serialNo || 'N/A',
      student.courseCode || 'N/A',
      student.courseTitle || 'N/A',
      student.studentCode || 'N/A',
      student.fullName || 'N/A',
    ]);

    this._pdfExportService.exportToPdf(
      headerLines,
      tableHeaders,
      tableData,
      'Registered_Students_Per_Batch_Report'
    );
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
  getListOfCourseOffering(termId: number, termYear: number, batchCode?: string) {
    this.courses = null;
    if (termId && termYear) {
      this.courseTermOfferingService.getListOfCourseByAcademicTermAndBatch(termId, termYear, batchCode)
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
}

