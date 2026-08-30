import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ExcelExportService } from '../services/excel-export.service';
import { PdfExportService } from '../services/pdf-export.service';
import { ReportService } from '../services/report.service';
import { LateRegistrationReportViewModel } from '../model/late-registration-report.model';
import { StaticData } from 'src/app/admission-request/model/StaticData';
import { ACADEMIC_TERM_STATUS } from 'src/app/common/constant';
import { TermCourseOfferingService } from 'src/app/colleges/services/term-course-offering.service';
import { PaginatorService, ServerPaginator } from 'src/app/reports/services/paginator.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-late-registration',
  templateUrl: './late-registration.component.html',
  styleUrls: ['./late-registration.component.scss']
})
export class LateRegistrationComponent implements OnInit, OnDestroy {
  rows: LateRegistrationReportViewModel[] = [];
  isLoading = false;
  isFormCollapsed = false;
  hasSearched = false;
  form: FormGroup;
  listOfBatch: any[] = [];
  listOfTermNumber: StaticData[] = [];
  yearList: number[] = [];
  searchKey = '';
  pager: ServerPaginator;
  statusOptions = [
    { id: '', description: 'All' },
    { id: 'onschedule', description: 'On schedule' },
    { id: 'late', description: 'Late' },
    { id: 'notregistered', description: 'Not registered' },
    { id: 'registerednotpaid', description: 'Registered, not paid' },
    { id: 'penaltypaid', description: 'Penalty paid' }
  ];

  constructor(
    private reportService: ReportService,
    private excelExportService: ExcelExportService,
    private pdfExportService: PdfExportService,
    private fb: FormBuilder,
    private courseTermOfferingService: TermCourseOfferingService,
    private paginator: PaginatorService
  ) {
    this.pager = this.paginator.create();
    this.yearList = this.getYearRange(new Date().getFullYear());
    this.form = this.fb.group({
      termId: [null, [Validators.required]],
      termYear: [null, [Validators.required]],
      batchCode: [null, [Validators.required]],
      status: ['']
    });
  }

  ngOnInit(): void {
    this.pager.init(() => this.searchReport(false));
    this.getListOfAcademicTermStatus();
    this.termId.valueChanges.subscribe(res => {
      if (res && this.termYear.value) {
        this.getListOfBatch(res, this.termYear.value);
      }
    });
    this.termYear.valueChanges.subscribe(year => {
      if (year && this.termId.value) {
        this.getListOfBatch(this.termId.value, year);
      }
    });
  }

  ngOnDestroy(): void {
    this.pager.destroy();
  }

  getListOfAcademicTermStatus() {
    this.listOfTermNumber = ACADEMIC_TERM_STATUS.map(pair => ({
      Id: pair.Id,
      Description: pair.Description
    }));
  }

  getYearRange(currentYear: number): number[] {
    const yearList = [];
    for (let year = 1998; year <= currentYear; year++) {
      yearList.push(year);
    }
    return yearList.reverse();
  }

  getListOfBatch(termId: number = 0, termYear: number = 0) {
    this.courseTermOfferingService.getListOfBatchCodeByAcademicTerm(termId, termYear).subscribe(res => {
      this.listOfBatch = res;
    });
  }

  searchReport(resetPage = true) {
    if (!this.form.valid) {
      return;
    }
    if (resetPage) {
      this.pager.pageIndex = 1;
    }
    this.isLoading = true;
    this.pager.loading = true;
    this.hasSearched = true;
    const formModel = this.form.getRawValue();
    this.reportService.getLateRegistrationReportPaginated(
      formModel.termId,
      formModel.termYear,
      formModel.batchCode,
      formModel.status,
      this.pager.query()
    ).subscribe({
      next: (res: any) => {
        this.rows = res.data || [];
        this.pager.applyResult(res);
        this.isLoading = false;
        this.isFormCollapsed = true;
      },
      error: () => {
        this.rows = [];
        this.pager.fail();
        this.isLoading = false;
        this.isFormCollapsed = true;
      }
    });
  }

  loadData() {
    this.form.reset({ status: '' });
    this.rows = [];
    this.searchKey = '';
    this.hasSearched = false;
    this.isFormCollapsed = true;
    this.pager.pageIndex = 1;
    this.pager.total = 0;
    this.pager.searchKey = '';
  }

  get termId() {
    return this.form.get('termId');
  }

  get termYear() {
    return this.form.get('termYear');
  }

  get batchCode() {
    return this.form.get('batchCode');
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

  statusColor(status: string): string {
    if (!status) {
      return 'default';
    }
    if (status.includes('on schedule')) {
      return 'green';
    }
    if (status.includes('penalty unpaid') || status.includes('not paid')) {
      return 'orange';
    }
    if (status.includes('Not registered')) {
      return 'red';
    }
    if (status.includes('late')) {
      return 'gold';
    }
    return 'blue';
  }

  private loadExportRows(onLoaded: (rows: LateRegistrationReportViewModel[]) => void): void {
    if (!this.form.valid) {
      return;
    }
    const formModel = this.form.getRawValue();
    this.reportService.getLateRegistrationReportPaginated(
      formModel.termId,
      formModel.termYear,
      formModel.batchCode,
      formModel.status,
      this.pager.query({ pageSize: 10000, pageindex: 0 }, this.searchKey)
    ).subscribe({
      next: (res: any) => onLoaded(res.data || [])
    });
  }

  exportToExcel(): void {
    this.loadExportRows(rows => {
      if (!rows.length) {
        return;
      }
      const formModel = this.form.getRawValue();
      const term = this.listOfTermNumber.find(x => x.Id === formModel.termId)?.Description || formModel.termId;
      const excelData = [
        [`Academic Term: ${term}`],
        [`Term Year: ${formModel.termYear}`],
        [`Batch Code: ${formModel.batchCode}`],
        ['Serial No', 'Student Code', 'Full Name', 'Batch Code', 'Registration Date', 'Penalty', 'Status'],
        ...rows.map(row => [
          row.serialNo,
          row.studentCode,
          row.fullName,
          row.batchCode,
          row.registrationDate ? new Date(row.registrationDate).toLocaleDateString() : '',
          row.penaltyAmount,
          row.status
        ])
      ];
      const merges: XLSX.Range[] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } }
      ];
      this.excelExportService.exportWithCustomLayout(
        excelData,
        'Late_Registration_Report',
        'Students',
        merges
      );
    });
  }

  exportToPdf(): void {
    this.loadExportRows(rows => {
      if (!rows.length) {
        return;
      }
      const formModel = this.form.getRawValue();
      const term = this.listOfTermNumber.find(x => x.Id === formModel.termId)?.Description || formModel.termId;
      const headerLines = [
        `Academic Term: ${term}`,
        `Term Year: ${formModel.termYear}`,
        `Batch Code: ${formModel.batchCode}`
      ];
      const tableHeaders = ['Serial No', 'Student Code', 'Full Name', 'Batch Code', 'Registration Date', 'Penalty', 'Status'];
      const tableData = rows.map(row => [
        row.serialNo,
        row.studentCode,
        row.fullName,
        row.batchCode,
        row.registrationDate ? new Date(row.registrationDate).toLocaleDateString() : '',
        row.penaltyAmount,
        row.status
      ]);
      this.pdfExportService.exportToPdf(headerLines, tableHeaders, tableData, 'Late_Registration_Report');
    });
  }
}
