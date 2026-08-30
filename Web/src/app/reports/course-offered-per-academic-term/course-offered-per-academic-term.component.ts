import { Component, OnDestroy, OnInit } from '@angular/core';
import { ExcelExportService } from '../services/excel-export.service';
import { PdfExportService } from '../services/pdf-export.service';
import { ReportService } from '../services/report.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ACADEMIC_TERM_STATUS } from 'src/app/common/constant';
import { StaticData } from 'src/app/admission-request/model/StaticData';
import { SearchQueryParams } from '../SearchParam/search-query-params';
import { CourseOffered } from '../model/course-offered.model';
import * as XLSX from 'xlsx';
import { PaginatorService, ServerPaginator } from 'src/app/reports/services/paginator.service';

@Component({
  selector: 'app-course-offered-per-academic-term',
  templateUrl: './course-offered-per-academic-term.component.html',
  styleUrls: ['./course-offered-per-academic-term.component.scss']
})
export class CourseOfferedPerAcademicTermComponent implements OnInit, OnDestroy {
  courses: CourseOffered[] = [];
  isLoading = false;
  isFormCollapsed = false;
  hasSearched = false;
  formCourseOffered: FormGroup;
  listOfTermNumber: StaticData[] = [];
  yearList: number[] = [];
  searchKey = '';
  pager: ServerPaginator;

  constructor(
    private _reportService: ReportService,
    private _excelExportService: ExcelExportService,
    private _pdfExportService: PdfExportService,
    private _fb: FormBuilder,
    private paginator: PaginatorService
  ) {
    this.pager = this.paginator.create();
    const currentYear = new Date();
    this.yearList = this.getYearRange(currentYear.getFullYear());
    this.createCourseOffering();
  }

  ngOnInit(): void {
    this.pager.init(() => this.getCourseOfferedPerAcademicTerm(false));
    this.getListOfAcademicTermStatus();
  }

  ngOnDestroy(): void {
    this.pager.destroy();
  }

  getCourseOfferedPerAcademicTerm(resetPage = true) {
    if (!this.formCourseOffered.valid) {
      return;
    }
    if (resetPage) {
      this.pager.pageIndex = 1;
    }
    this.isLoading = true;
    this.pager.loading = true;
    this.hasSearched = true;
    const formModel = this.getStudentRegistered();
    this._reportService.getListOfCourseOfferedPerTermPaginated(
      formModel.termId,
      formModel.termYear,
      this.pager.query()
    ).subscribe({
      next: (res: any) => {
        this.courses = res.data || [];
        this.pager.applyResult(res);
        this.isLoading = false;
        this.isFormCollapsed = true;
      },
      error: () => {
        this.courses = [];
        this.pager.fail();
        this.isLoading = false;
        this.isFormCollapsed = true;
      }
    });
  }

  loadData() {
    this.formCourseOffered.reset();
    this.courses = [];
    this.hasSearched = false;
    this.searchKey = '';
    this.isFormCollapsed = true;
    this.pager.pageIndex = 1;
    this.pager.total = 0;
    this.pager.searchKey = '';
  }

  private createCourseOffering() {
    this.formCourseOffered = this._fb.group({
      termId: [null, [Validators.required]],
      termYear: [null, [Validators.required]]
    });
  }

  getStudentRegistered(): SearchQueryParams {
    const formModel = this.formCourseOffered.getRawValue();
    const params = new SearchQueryParams();
    params.termId = formModel.termId;
    params.termYear = formModel.termYear;
    return params;
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

  exportToExcel(): void {
    const formModel = this.getStudentRegistered();
    this._reportService.getListOfCourseOfferedPerTerm(formModel).subscribe({
      next: (res) => {
        if (!res?.length || !res[0]?.courses?.length) {
          return;
        }
        const term = res[0].academicTerm;
        const excelData = [
          [`Academic Term: ${term}`],
          ["Serial No", "Batch Code", "Course Code", "Course Title", "Credit Hours"],
          ...res[0].courses.map(course => [
            course.serialNo,
            course.batchCode,
            course.courseCode,
            course.courseTitle,
            course.creditHours,
          ])
        ];
        const merges: XLSX.Range[] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
          { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }
        ];
        this._excelExportService.exportWithCustomLayout(
          excelData,
          'Course_Offered_Per_Academic_Term',
          'Courses',
          merges
        );
      }
    });
  }

  downloadPdf(): void {
    const formModel = this.getStudentRegistered();
    this._reportService.getListOfCourseOfferedPerTerm(formModel).subscribe({
      next: (res) => {
        if (!res?.length || !res[0]?.courses?.length) {
          return;
        }
        const headerLines = [
          `Academic Term: ${res[0].academicTerm}`,
        ];
        const tableHeaders = ['Serial No', 'Batch Code', 'Course Code', 'Course Title', 'Credit Hours'];
        const tableData = res[0].courses.map(course => [
          course.serialNo,
          course.batchCode,
          course.courseCode,
          course.courseTitle,
          course.creditHours,
        ]);
        this._pdfExportService.exportToPdf(
          headerLines,
          tableHeaders,
          tableData,
          'course_offered_Report'
        );
      }
    });
  }
}
