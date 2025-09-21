import { Component, OnInit } from '@angular/core';
import { ExcelExportService } from '../services/excel-export.service';
import { PdfExportService } from '../services/pdf-export.service';
import { ReportService } from '../services/report.service';
import { CourseOfferedPerTerm } from '../model/course-offered-per-term.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ACADEMIC_TERM_STATUS } from 'src/app/common/constant';
import { StaticData } from 'src/app/admission-request/model/StaticData';
import { SearchQueryParams } from '../SearchParam/search-query-params';
import { CourseOffered } from '../model/course-offered.model';
import * as XLSX from 'xlsx';
@Component({
  selector: 'app-course-offered-per-academic-term',
  templateUrl: './course-offered-per-academic-term.component.html',
  styleUrls: ['./course-offered-per-academic-term.component.scss']
})
export class CourseOfferedPerAcademicTermComponent implements OnInit {

  data: CourseOfferedPerTerm[] = [];
  courses: CourseOffered[] = [];
  isLoading = false;
  isFormCollapsed = false;
  hasSearched = false;
  formCourseOffered: FormGroup;
  headers = ['Batch Code', 'Course Code', 'Course Title', 'Credit Hours'];
  listOfTermNumber: StaticData[] = [];
  yearList: number[] = [];
  pageIndex = 1;
  pageSize = 10;
  pageSizeOption = [5, 10, 15, 25, 50, 100];
  total = 0;
  searchKey = '';
  sortOrder = '';
  sortColumn = '';
  paginatedRegisteredStudent: CourseOffered[] = [];
  constructor(
    private _reportService: ReportService,
    private _excelExportService: ExcelExportService,
    private _pdfExportService: PdfExportService,
    private _fb: FormBuilder,
  ) {
    const currentYear = new Date();
    this.yearList = this.getYearRange(currentYear.getFullYear());
    this.createCourseOffering();
  }
  ngOnInit(): void {
    this.getListOfAcademicTermStatus();

  }
  getCourseOfferedPerAcademicTerm() {
    this.isLoading = true;
    this.hasSearched = true;
    const formModel = this.getStudentRegistered();
    this._reportService.getListOfCourseOfferedPerTerm(formModel)
      .subscribe(res => {
        this.data = res;
        this.courses = this.data[0]?.courses;;
        this.total = this.courses.length;
        this.updatePaginatedRegisteredStudent();
        this.isLoading = false;
      })
  }

  loadData() {
    this.formCourseOffered.reset();
    this.courses = [];
    this.paginatedRegisteredStudent = [];
    this.total = 0;
    this.hasSearched = false;
    this.isFormCollapsed = true;
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

  exportToExcel(): void {
    // Get course data from the main object (not array)
    const term = this.data[0].academicTerm;
    const excelData = [
      [`Academic Term: ${term}`],
      ["Serial No", "Batch Code", "Course Code", "Course Title", "Credit Hours"],
      ...this.data[0].courses.map(student => [
        student.serialNo,
        student.batchCode,
        student.courseCode,
        student.courseTitle,
        student.creditHours,
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
  downloadPdf(): void {
    const headerLines = [
      `Academic Term: ${this.data[0].academicTerm}`,
    ];

    const tableHeaders = ['Serial No', 'Batch Code', 'Course Code', 'Course Title', 'Credit Hours'];

    const tableData = this.data[0].courses.map(student => [
      student.serialNo,
      student.batchCode,
      student.courseCode,
      student.courseTitle,
      student.creditHours,
    ]);

    this._pdfExportService.exportToPdf(
      headerLines,
      tableHeaders,
      tableData,
      'course_offered_Report'
    );
  }

  updatePaginatedRegisteredStudent(): void {
    const startIndex = (this.pageIndex - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedRegisteredStudent = this.courses.slice(startIndex, endIndex);
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

}
