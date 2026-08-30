import { Component, OnDestroy, OnInit } from '@angular/core';
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
import { PaginatorService, ServerPaginator } from 'src/app/reports/services/paginator.service';
@Component({
  selector: 'app-registered-student-per-course',
  templateUrl: './registered-student-per-course.component.html',
  styleUrls: ['./registered-student-per-course.component.scss']
})
export class RegisteredStudentPerCourseComponent implements OnInit, OnDestroy {
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
  pager: ServerPaginator;
  constructor(
    private _reportService: ReportService,
    private _excelExportService: ExcelExportService,
    private _pdfExportService: PdfExportService,
    private _fb: FormBuilder,
    private _crudService: CrudService,
    private _termCourseOfferingService: TermCourseOfferingService,
    private paginator: PaginatorService
  ) {
    this.pager = this.paginator.create();
    const currentYear = new Date();
    this.yearList = this.getYearRange(currentYear.getFullYear());
    this.createCourseOffering();
    this.isLoading = false;
  }

  ngOnInit(): void {
    this.pager.init(() => this.getRegisteredStudentPerCourse(false));
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
  ngOnDestroy(): void {
    this.pager.destroy();
  }

  getRegisteredStudentPerCourse(resetPage = true) {
    if (!this.formRegisteredStudentPerCourse.valid) {
      return;
    }
    if (resetPage) {
      this.pager.pageIndex = 1;
    }
    this.isLoading = true;
    this.pager.loading = true;
    this.hasSearched = true;
    const formModel = this.getStudentRegistered();
    this._reportService.getListOfRegisteredStudentPerCoursePaginated(
      formModel.termId,
      formModel.termYear,
      formModel.courseId,
      this.pager.query()
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
        this.data = null;
        this.isLoading = false;
        this.isFormCollapsed = true;
      }
    });
  }
  exportToExcel(): void {
    const formModel = this.getStudentRegistered();
    this._reportService.getListOfRegisteredStudentPerCourse(formModel).subscribe({
      next: (res: any) => {
        const rows = Array.isArray(res) ? res : [];
        if (!rows.length || !rows[0]) {
          return;
        }
        this.data = rows[0];
        const term = rows[0].academicTerm || 'N/A';
        const course = `${rows[0].courseCode || 'N/A'} - ${rows[0].courseTitle || 'N/A'}`;
        const studentData = rows[0].studentInformation || [];
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
    });
  }
  exportToPdf(): void {
    const formModel = this.getStudentRegistered();
    this._reportService.getListOfRegisteredStudentPerCourse(formModel).subscribe({
      next: (res: any) => {
        const rows = Array.isArray(res) ? res : [];
        if (!rows.length || !rows[0]) {
          return;
        }
        this.data = rows[0];
        const headerLines = [
          `Academic Term: ${rows[0].academicTerm || 'N/A'}`,
          `Course: ${rows[0].courseCode || 'N/A'} - ${rows[0].courseTitle || 'N/A'}`
        ];
        const tableHeaders = ['Serial No', 'Student Code', 'Full Name', 'Batch Code'];
        const studentData = rows[0].studentInformation || [];
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
    });
  }
  getStudentRegistered(): SearchQueryParams {
    const formModel = this.formRegisteredStudentPerCourse.getRawValue();
    const params = new SearchQueryParams();
    params.termId = formModel.termId;
    params.termYear = formModel.termYear;
    params.courseId = formModel.courseId;
    return params;
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
  loadData(): void {
    this.formRegisteredStudentPerCourse.reset();
    this.registeredStudentInformation = [];
    this.paginatedRegisteredStudent = [];
    this.total = 0;
    this.hasSearched = false;
    this.searchKey = '';
    this.pager.pageIndex = 1;
    this.pager.total = 0;
    this.pager.searchKey = '';
  }
}
