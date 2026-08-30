import { Component, OnDestroy, OnInit } from '@angular/core';
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
import { PaginatorService, ServerPaginator } from 'src/app/reports/services/paginator.service';
@Component({
  selector: 'app-registered-student-per-batch',
  templateUrl: './registered-student-per-batch.component.html',
  styleUrls: ['./registered-student-per-batch.component.scss']
})
export class RegisteredStudentPerBatchComponent implements OnInit, OnDestroy {
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
  pager: ServerPaginator;
  constructor(
    private _reportService: ReportService,
    private _excelExportService: ExcelExportService,
    private _pdfExportService: PdfExportService,
    private _batchService: BatchService,
    private _fb: FormBuilder,
    private _crudService: CrudService,
    private courseTermOfferingService: TermCourseOfferingService,
    private paginator: PaginatorService
  ) {
    this.pager = this.paginator.create();
    const currentYear = new Date();
    this.yearList = this.getYearRange(currentYear.getFullYear());
    this.createRegisteredStudentPerBatch();
  }

  ngOnInit(): void {
    this.pager.init(() => this.getRegisteredStudentPerBatch(false));
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
  ngOnDestroy(): void {
    this.pager.destroy();
  }

  getRegisteredStudentPerBatch(resetPage = true) {
    if (!this.formRegisteredStudentPerBatch.valid) {
      return;
    }
    if (resetPage) {
      this.pager.pageIndex = 1;
    }
    this.isLoading = true;
    this.pager.loading = true;
    this.hasSearched = true;
    const formModel = this.getStudentRegistered();
    this._reportService.getListOfRegisteredStudentPerBatchPaginated(
      formModel.termId,
      formModel.termYear,
      formModel.batchCode,
      this.pager.query({
        courseId: formModel.courseId || null
      })
    ).subscribe({
      next: (res: any) => {
        this.registeredStudentInformation = res.data || [];
        this.paginatedRegisteredStudent = [...this.registeredStudentInformation];
        this.pager.applyResult(res);
        this.total = this.pager.total;
        this.isLoading = false;
        this.isFormCollapsed = true;
      },
      error: () => {
        this.registeredStudentInformation = [];
        this.paginatedRegisteredStudent = [];
        this.pager.fail();
        this.total = 0;
        this.isLoading = false;
        this.isFormCollapsed = true;
      }
    });
  }

  loadData() {
    this.formRegisteredStudentPerBatch.reset();
    this.registeredStudentInformation = [];
    this.paginatedRegisteredStudent = [];
    this.total = 0;
    this.hasSearched = false;
    this.searchKey = '';
    this.isFormCollapsed = true;
    this.pager.pageIndex = 1;
    this.pager.total = 0;
    this.pager.searchKey = '';
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
    const formModel = this.getStudentRegistered();
    this._reportService.getListOfRegisteredStudentPerBatch(formModel).subscribe({
      next: (res: any) => {
        const rows = Array.isArray(res) ? res : [];
        if (!rows.length || !rows[0]) {
          return;
        }
        this.data = rows[0];
        const firstDataItem = rows[0];
        const formValues = this.formRegisteredStudentPerBatch.getRawValue();
        const selectedCourseId = formValues.courseId;
        const term = firstDataItem.academicTerm || 'N/A';
        const batch = firstDataItem.batchCode || 'N/A';
        let courseInfo = 'All Courses';
        if (selectedCourseId && this.courses) {
          const selectedCourse = this.courses.find(course => course.courseId === selectedCourseId || course.id === selectedCourseId);
          if (selectedCourse) {
            courseInfo = `${selectedCourse.courseCode} - ${selectedCourse.courseTitle}`;
          }
        } else if (firstDataItem.courseCode && firstDataItem.courseTitle) {
          courseInfo = `${firstDataItem.courseCode} - ${firstDataItem.courseTitle}`;
        }
        const studentInfo = firstDataItem.studentInformation || [];
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
    });
  }
  exportToPdf(): void {
    const formModel = this.getStudentRegistered();
    this._reportService.getListOfRegisteredStudentPerBatch(formModel).subscribe({
      next: (res: any) => {
        const rows = Array.isArray(res) ? res : [];
        if (!rows.length || !rows[0]) {
          return;
        }
        this.data = rows[0];
        const firstDataItem = rows[0];
        const formValues = this.formRegisteredStudentPerBatch.getRawValue();
        const selectedCourseId = formValues.courseId;
        const term = firstDataItem.academicTerm || 'N/A';
        const batch = firstDataItem.batchCode || 'N/A';
        let courseInfo = 'All Courses';
        if (selectedCourseId && this.courses) {
          const selectedCourse = this.courses.find(course => course.courseId === selectedCourseId || course.id === selectedCourseId);
          if (selectedCourse) {
            courseInfo = `${selectedCourse.courseCode} - ${selectedCourse.courseTitle}`;
          }
        } else if (firstDataItem.courseCode && firstDataItem.courseTitle) {
          courseInfo = `${firstDataItem.courseCode} - ${firstDataItem.courseTitle}`;
        }
        const headerLines = [
          `Academic Term: ${term}`,
          `Course: ${courseInfo}`,
          `Batch Code: ${batch}`
        ];
        const tableHeaders = ['Serial No', 'Course Code', 'Course Title', 'Student Code', 'Full Name'];
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
    });
  }

  search(): void {
    this.pager.onSearch(this.searchKey);
  }

  onPageIndexChange(page: number): void {
    this.pager.onPageIndexChange(page);
  }

  onPageSizeChange(size: number): void {
    this.pager.onPageSizeChange(size);
  }

  onSort(sort: { key: string; value: string }): void {
    this.pager.onSort(sort);
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

