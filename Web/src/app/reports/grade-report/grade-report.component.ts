import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReportService } from '../services/report.service';
import { ExcelExportService } from '../services/excel-export.service';
import { PdfExportService } from '../services/pdf-export.service';
import { GradeReportQueryParams } from '../model/grade-report-query-params.model';
import { PaginatedGradeReportResponse, GradeReportParentViewModel } from '../model/grade-report-view-model.model';
import { ACADEMIC_TERM_STATUS } from 'src/app/common/constant';
import { StaticData } from 'src/app/admission-request/model/StaticData';
import { TermCourseOfferingService } from 'src/app/colleges/services/term-course-offering.service';
import { PaginatorService } from '../services/paginator.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-grade-report',
  templateUrl: './grade-report.component.html',
  styleUrls: ['./grade-report.component.scss']
})
export class GradeReportComponent implements OnInit {
  gradeReportData: GradeReportParentViewModel[] = [];
  paginatedResponse: PaginatedGradeReportResponse | null = null;
  isLoading = false;
  isExportingExcel = false;
  isExportingPdf = false;
  isFormCollapsed = false;
  hasSearched = false;
  formGradeReport: FormGroup;
  listOfBatch: any[] = [];
  listOfTermNumber: StaticData[] = [];
  yearList: number[] = [];
  
  // Pagination properties
  pageIndex = 1; // 1-based for UI (ng-zorro uses 1-based)
  pageSize = 10;
  pageSizeOption = [5, 10, 15, 25, 50, 100];
  total = 0;
  
  // Expanded rows tracking
  expandSet = new Set<number>();
  
  // Sorting properties
  sortColumn: string = '';
  sortOrder: string | null = null;

  constructor(
    private _reportService: ReportService,
    private _excelExportService: ExcelExportService,
    private _pdfExportService: PdfExportService,
    private _fb: FormBuilder,
    private courseTermOfferingService: TermCourseOfferingService,
    private paginatorService: PaginatorService
  ) {
    const currentYear = new Date();
    this.yearList = this.getYearRange(currentYear.getFullYear());
    this.createGradeReportForm();
  }

  ngOnInit(): void {
    // Subscribe to termId changes
    this.termId.valueChanges.subscribe(res => {
      if (res && this.termYear.value) {
        this.getListOfBatch(res, this.termYear.value);
      }
    });
    
    // Subscribe to year changes
    this.termYear.valueChanges.subscribe(year => {
      if (year && this.termId.value) {
        this.getListOfBatch(this.termId.value, year);
      }
    });
    
    this.getListOfAcademicTermStatus();
  }

  private createGradeReportForm() {
    this.formGradeReport = this._fb.group({
      termId: [null, [Validators.required]],
      termYear: [null, [Validators.required]],
      batchCode: [null, []], // Optional
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

  getListOfBatch(termId: number = 0, termYear: number = 0) {
    this.courseTermOfferingService.getListOfBatchCodeByAcademicTerm(termId, termYear).subscribe(res => {
      this.listOfBatch = res;
    });
  }

  getGradeReport() {
    if (!this.formGradeReport.valid) {
      return;
    }

    this.isLoading = true;
    this.hasSearched = true;
    const queryParams = this.buildQueryParams();
    
    this._reportService.getGradeReport(queryParams)
      .subscribe({
        next: (res: PaginatedGradeReportResponse) => {
          this.paginatedResponse = res;
          this.gradeReportData = res.data || [];
          this.total = res.totalRowCount || 0;
          this.pageIndex = res.currentPage + 1; // Convert 0-based to 1-based
          this.pageSize = res.itemPerPage;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error fetching grade report:', err);
          this.isLoading = false;
          this.gradeReportData = [];
          this.total = 0;
        }
      });
  }

  buildQueryParams(): GradeReportQueryParams {
    const formModel = this.formGradeReport.getRawValue();
    const params = new GradeReportQueryParams();
    params.termId = formModel.termId;
    params.termYear = formModel.termYear;
    params.batchCode = formModel.batchCode || '';
    params.pageIndex = this.pageIndex - 1; // Convert 1-based to 0-based
    params.pageSize = this.pageSize;
    params.sortField = this.sortColumn || undefined;
    params.sortOrder = this.sortOrder || undefined;
    return params;
  }

  loadData() {
    this.formGradeReport.reset();
    this.gradeReportData = [];
    this.paginatedResponse = null;
    this.total = 0;
    this.hasSearched = false;
    this.isFormCollapsed = true;
    this.pageIndex = 1;
    this.expandSet.clear();
    this.sortColumn = '';
    this.sortOrder = null;
  }
  
  // Sort handler
  sort(column: string, order: string | null): void {
    // Only sort if we have searched and form is valid
    if (!this.hasSearched || !this.formGradeReport.valid) {
      return;
    }
    
    this.sortColumn = order ? column : '';
    this.sortOrder = order;
    
    // Reset to first page when sorting changes
    this.pageIndex = 1;
    
    // Reload data with new sort parameters
    this.getGradeReport();
  }

  get termId() {
    return this.formGradeReport.get("termId");
  }

  get termYear() {
    return this.formGradeReport.get("termYear");
  }

  get batchCode() {
    return this.formGradeReport.get("batchCode");
  }

  // Pagination handlers
  onPageIndexChange(page: number): void {
    this.pageIndex = page;
    if (this.hasSearched) {
      this.getGradeReport();
    }
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageIndex = 1;
    if (this.hasSearched) {
      this.getGradeReport();
    }
  }

  // Expand/Collapse row handlers
  onExpandChange(serialNo: number, checked: boolean): void {
    if (checked) {
      this.expandSet.add(serialNo);
    } else {
      this.expandSet.delete(serialNo);
    }
  }

  // Export functions
  exportToExcel(): void {
    if (!this.formGradeReport.valid) {
      console.error('Form is not valid');
      return;
    }

    this.isExportingExcel = true;
    const formValues = this.formGradeReport.getRawValue();
    const term = this.getTermDescription(formValues.termId);
    const year = formValues.termYear;
    const batch = formValues.batchCode || 'All Batches';

    // Fetch all data for export (no pagination limit)
    const exportParams = this.buildQueryParams();
    exportParams.pageIndex = 0;
    exportParams.pageSize = 999999; // Very large number to get all records

    this._reportService.getGradeReport(exportParams)
      .subscribe({
        next: (res: PaginatedGradeReportResponse) => {
          const allData = res.data || [];
          
          if (allData.length === 0) {
            console.error('No data available for export');
            this.isExportingExcel = false;
            return;
          }

          const excelData: any[] = [
            [`Academic Term: ${term}`],
            [`Year: ${year}`],
            [`Batch Code: ${batch}`],
            [],
            ['#', 'Full Name', 'Batch Code', 'Academic Program', 'Course Code', 'Course Title', 'Grade', 'Points']
          ];

          allData.forEach((parent, parentIndex) => {
            if (parent.courseGrades && parent.courseGrades.length > 0) {
              parent.courseGrades.forEach((course, index) => {
                excelData.push([
                  index === 0 ? parentIndex + 1 : '',
                  index === 0 ? parent.fullName : '',
                  index === 0 ? parent.batchCode : '',
                  index === 0 ? parent.academicProgram : '',
                  course.courseCode,
                  course.courseTitle,
                  course.grade,
                  course.points || 0
                ]);
              });
            } else {
              excelData.push([
                parentIndex + 1,
                parent.fullName,
                parent.batchCode,
                parent.academicProgram,
                '',
                '',
                '',
                ''
              ]);
            }
          });

          const merges: XLSX.Range[] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
            { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
            { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } }
          ];

          this._excelExportService.exportWithCustomLayout(
            excelData,
            'Grade_Report',
            'Grades',
            merges
          );
          this.isExportingExcel = false;
        },
        error: (err) => {
          console.error('Error fetching data for export:', err);
          this.isExportingExcel = false;
        }
      });
  }

  exportToPdf(): void {
    if (!this.formGradeReport.valid) {
      console.error('Form is not valid');
      return;
    }

    this.isExportingPdf = true;
    const formValues = this.formGradeReport.getRawValue();
    const term = this.getTermDescription(formValues.termId);
    const year = formValues.termYear;
    const batch = formValues.batchCode || 'All Batches';

    // Fetch all data for export (no pagination limit)
    const exportParams = this.buildQueryParams();
    exportParams.pageIndex = 0;
    exportParams.pageSize = 999999; // Very large number to get all records

    this._reportService.getGradeReport(exportParams)
      .subscribe({
        next: (res: PaginatedGradeReportResponse) => {
          const allData = res.data || [];
          
          if (allData.length === 0) {
            console.error('No data available for PDF export');
            this.isExportingPdf = false;
            return;
          }

          const headerLines = [
            `Academic Term: ${term}`,
            `Year: ${year}`,
            `Batch Code: ${batch}`
          ];

          const tableHeaders = ['#', 'Full Name', 'Batch Code', 'Academic Program', 'Course Code', 'Course Title', 'Grade', 'Points'];

          const tableData: any[] = [];
          allData.forEach((parent, parentIndex) => {
            if (parent.courseGrades && parent.courseGrades.length > 0) {
              parent.courseGrades.forEach((course, index) => {
                tableData.push([
                  index === 0 ? parentIndex + 1 : '',
                  index === 0 ? parent.fullName : '',
                  index === 0 ? parent.batchCode : '',
                  index === 0 ? parent.academicProgram : '',
                  course.courseCode,
                  course.courseTitle,
                  course.grade,
                  course.points || 0
                ]);
              });
            } else {
              tableData.push([
                parentIndex + 1,
                parent.fullName,
                parent.batchCode,
                parent.academicProgram,
                '',
                '',
                '',
                ''
              ]);
            }
          });

          this._pdfExportService.exportToPdf(
            headerLines,
            tableHeaders,
            tableData,
            'Grade_Report'
          );
          this.isExportingPdf = false;
        },
        error: (err) => {
          console.error('Error fetching data for PDF export:', err);
          this.isExportingPdf = false;
        }
      });
  }

  getTermDescription(termId: number): string {
    const term = ACADEMIC_TERM_STATUS.find(t => t.Id === termId);
    return term ? term.Description : 'N/A';
  }

  getDisplayRange(): string {
    if (!this.paginatedResponse) return '';
    const range = this.paginatorService.getDisplayRange(
      this.paginatedResponse.currentPage,
      this.paginatedResponse.itemPerPage,
      this.paginatedResponse.totalRowCount
    );
    return `Showing ${range.start}-${range.end} of ${this.paginatedResponse.totalRowCount} items`;
  }
}
