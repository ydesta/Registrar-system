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
    private _crudService: CrudService
  ) {
    const currentYear = new Date();
    this.yearList = this.getYearRange(currentYear.getFullYear());
    this.createRegisteredStudentPerBatch();
  }

  ngOnInit(): void {
    this.getListOfBatch();
    this.getListOfAcademicTermStatus();
    this._crudService.getList("/courses").subscribe((res: any) => {
      this.courses = res.data;
    });
  }
  private createRegisteredStudentPerBatch() {
    this.formRegisteredStudentPerBatch = this._fb.group({
      termId: [null, [Validators.required]],
      termYear: [null, [Validators.required]],
      courseId: [null, [Validators.required]],
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
  getListOfBatch() {
    this._batchService.getBatchList().subscribe(res => {
      this.listOfBatch = res.data;
    })
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

  exportToExcel(): void {
    // Get course data from the main object (not array)
    const term = this.data[0].academicTerm;
    const course = `${this.data[0].courseCode} - ${this.data[0].courseTitle}`;
    const batch = this.data[0].batchCode;
    const excelData = [
      [`Academic Term: ${term}`],
      [`Course: ${course}`],
      [`Batch Code: ${batch}`],
      ["Serial No", "Student Code", "Full Name"],
      ...this.data[0].studentInformation.map(student => [
        student.serialNo,
        student.studentCode,
        student.fullName
      ])
    ];
    const merges: XLSX.Range[] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }
    ];

    this._excelExportService.exportWithCustomLayout(
      excelData,
      'Registered_Students_Per_Batch_Report',
      'Students',
      merges
    );
  }
  exportToPdf(): void {
    const headerLines = [
      `Academic Term: ${this.data[0].academicTerm}`,
      `Course: ${this.data[0].courseCode} - ${this.data[0].courseTitle}`,
      `Batch Code: ${this.data[0].batchCode}`
    ];

    const tableHeaders = ['Serial No', 'Student Code', 'Full Name'];

    const tableData = this.data[0].studentInformation.map(student => [
      student.serialNo,
      student.studentCode,
      student.fullName,
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

}

