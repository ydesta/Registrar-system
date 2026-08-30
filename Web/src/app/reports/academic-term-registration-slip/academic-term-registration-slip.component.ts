import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { StaticData } from 'src/app/admission-request/model/StaticData';
import { TermCourseOfferingService } from 'src/app/colleges/services/term-course-offering.service';
import { ACADEMIC_TERM_STATUS } from 'src/app/common/constant';
import { PdfExportService } from '../services/pdf-export.service';
import { StudentService } from 'src/app/students/services/student.service';
import { StudentRegistrationSlipViewModel } from 'src/app/students/models/student-profile-view-model.model';
import { CoursePaymentViewModel } from 'src/app/students/models/course-payment-view-model.model';
import { environment } from 'src/environments/environment.prod';
import { PaginatorService, ServerPaginator } from 'src/app/reports/services/paginator.service';

@Component({
  selector: 'app-academic-term-registration-slip',
  templateUrl: './academic-term-registration-slip.component.html',
  styleUrls: ['./academic-term-registration-slip.component.scss']
})
export class AcademicTermRegistrationSlipComponent implements OnInit, OnDestroy {
  listOfTermNumber: StaticData[] = [];
  yearList: number[] = [];
  formCourseOffered: FormGroup;
  listOfBatch: any[] = [];
  expandSet = new Set<string>();
  tbLoading = false;
  listOdRegisteredStudent: StudentRegistrationSlipViewModel[] = [];
  isFormCollapsed = false;
  hasSearched = false;
  searchKey = '';
  pager: ServerPaginator;

  constructor(
    private courseTermOfferingService: TermCourseOfferingService,
    private _pdfExportService: PdfExportService,
    private _fb: FormBuilder,
    private _studentService: StudentService,
    private _sanitizer: DomSanitizer,
    private paginator: PaginatorService
  ) {
    this.pager = this.paginator.create();
    const currentYear = new Date();
    this.yearList = this.getYearRange(currentYear.getFullYear());
    this.getListOfAcademicTermStatus();
    this.createCourseOffering();
  }

  ngOnInit(): void {
    this.pager.init(() => this.loadData(false));
    this.termId.valueChanges.subscribe(res => {
      if (res) {
        this.termYear.valueChanges.subscribe(year => {
          if (year) {
            this.getListOfBatch(res, year);
          }
        })
      }
    });

    // Subscribe to date changes to update validators dynamically
    this.startDate.valueChanges.subscribe(() => {
      this.updateValidators();
      // Trigger date range validation when start date changes
      this.endDate?.updateValueAndValidity({ emitEvent: false });
    });

    this.endDate.valueChanges.subscribe(() => {
      this.updateValidators();
      // Trigger date range validation when end date changes
      this.startDate?.updateValueAndValidity({ emitEvent: false });
    });

    this.studentId.valueChanges.subscribe(() => {
      this.updateValidators();
    });
  }

  /**
   * Updates form validators based on date range / student id selection
   * If both startDate and endDate are selected, or studentId has a value: termId, termYear, batchCode are optional
   * Otherwise: termId, termYear, batchCode are required
   */
  private updateValidators(): void {
    const hasDateRange = this.startDate?.value && this.endDate?.value;
    const hasStudentId = !!this.studentId?.value?.toString()?.trim();
    
    if (hasDateRange || hasStudentId) {
      this.termId?.setValidators([]);
      this.termYear?.setValidators([]);
      this.batchCode?.setValidators([]);
    } else {
      this.termId?.setValidators([Validators.required]);
      this.termYear?.setValidators([Validators.required]);
      this.batchCode?.setValidators([Validators.required]);
    }
    
    // Update validity
    this.termId?.updateValueAndValidity({ emitEvent: false });
    this.termYear?.updateValueAndValidity({ emitEvent: false });
    this.batchCode?.updateValueAndValidity({ emitEvent: false });
  }

  /**
   * Checks if form is valid based on conditional validation rules
   */
  get isFormValid(): boolean {
    const formModel = this.formCourseOffered.getRawValue();
    const hasDateRange = formModel.startDate && formModel.endDate;
    const hasStudentId = !!(formModel.studentId && formModel.studentId.toString().trim());
    const dateRangeError = this.endDate?.errors?.['dateRangeInvalid'];
    if (dateRangeError) {
      return false;
    }
    
    if (hasDateRange || hasStudentId) {
      return true;
    }

    return !!(formModel.termId && formModel.termYear && formModel.batchCode);
  }

  /**
   * Custom validator to check that end date is not less than start date
   */
  private endDateValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null; // Don't validate if end date is empty
    }

    const startDate = this.startDate?.value;
    if (!startDate) {
      return null; // Don't validate if start date is empty
    }

    const start = new Date(startDate);
    const end = new Date(control.value);
    
    // Reset time to compare only dates
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (start > end) {
      return { dateRangeInvalid: true };
    }

    return null;
  }

  private createCourseOffering() {
    // Initially, termId, termYear, batchCode are required (since dates are null)
    this.formCourseOffered = this._fb.group({
      termId: [null, [Validators.required]],
      termYear: [null, [Validators.required]],
      batchCode: [null, [Validators.required]],
      startDate: [null],
      endDate: [null, [this.endDateValidator.bind(this)]],
      studentId: [null, []],
    });
  }
  get termId() {
    return this.formCourseOffered.get("termId");
  }
  get termYear() {
    return this.formCourseOffered.get("termYear");
  }
  get batchCode() {
    return this.formCourseOffered.get("batchCode");
  }
  get startDate() {
    return this.formCourseOffered.get("startDate");
  }
  get endDate() {
    return this.formCourseOffered.get("endDate");
  }
  get studentId() {
    return this.formCourseOffered.get("studentId");
  }

  getListOfBatch(termId: number = 0, termYear: number = 0) {
    this.courseTermOfferingService.getListOfBatchCodeByAcademicTerm(termId, termYear).subscribe(res => {
      this.listOfBatch = res;
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
  onExpandChange(id: string, checked: boolean): void {
    if (checked) {
      this.expandSet.add(id);
    } else {
      this.expandSet.delete(id);
    }
  }
  ngOnDestroy(): void {
    this.pager.destroy();
  }

  onPageIndexChange(page: number): void {
    this.pager.onPageIndexChange(page);
  }

  onPageSizeChange(size: number): void {
    this.pager.onPageSizeChange(size);
  }

  search(): void {
    this.pager.onSearch(this.searchKey);
  }

  private loadData(resetPage = true): void {
    const formModel = this.formCourseOffered.getRawValue();
    const hasDateRange = formModel.startDate && formModel.endDate;
    const hasRequiredFields = formModel.termId && formModel.termYear && formModel.batchCode;
    const hasStudentId = !!(formModel.studentId && formModel.studentId.toString().trim());
    if (!(hasDateRange || hasRequiredFields || hasStudentId)) {
      return;
    }
    if (resetPage) {
      this.pager.pageIndex = 1;
    }
    this.tbLoading = true;
    this.pager.loading = true;
    this.hasSearched = true;
    const startDate = formModel.startDate ? this.formatDate(formModel.startDate) : '';
    const endDate = formModel.endDate ? this.formatDate(formModel.endDate) : '';
    const studentId = formModel.studentId ? formModel.studentId.toString().trim() : null;
    const batchCode = formModel.batchCode || null;
    this._studentService.getListOfTermRegisteredCourseListPaginated(
      batchCode,
      startDate,
      endDate,
      studentId,
      this.pager.query()
    ).subscribe({
      next: (res: any) => {
        this.listOdRegisteredStudent = res.data || [];
        this.pager.applyResult(res);
        this.tbLoading = false;
        this.isFormCollapsed = true;
      },
      error: () => {
        this.listOdRegisteredStudent = [];
        this.pager.fail();
        this.tbLoading = false;
      }
    });
  }

  public resetData(): void {
    this.formCourseOffered.reset();
    this.listOdRegisteredStudent = [];
    this.hasSearched = false;
    this.searchKey = '';
    this.isFormCollapsed = false;
    this.pager.pageIndex = 1;
    this.pager.total = 0;
    this.pager.searchKey = '';
    this.updateValidators();
  }

  getYearRange(currentYear: number): number[] {
    const startYear = 1998;
    const yearList = [];
    for (let year = startYear; year <= currentYear; year++) {
      yearList.push(year);
    }
    return yearList.reverse();
  }
  printRegistrationSlip(): void {
    window.print();
  }
  downloadRegistrationSlip(): void {
    const element = document.getElementById('registration-slip');
    if (element) {
      // Sanitize HTML content to prevent XSS attacks
      const rawHtml = element.innerHTML;
      const sanitizedHtml = this.sanitizeHtmlForDownload(rawHtml);
      
      const blob = new Blob([sanitizedHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'registration-slip.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Sanitizes HTML content to prevent XSS attacks before downloading
   * @param html - Raw HTML string to sanitize
   * @returns Sanitized HTML string safe for download
   */
  private sanitizeHtmlForDownload(html: string): string {
    if (!html) return '';
    
    // Remove script tags and their content
    let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove javascript: protocols
    sanitized = sanitized.replace(/javascript:/gi, '');
    
    // Remove on* event handlers (onclick, onload, etc.)
    sanitized = sanitized.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '');
    sanitized = sanitized.replace(/\son\w+\s*=\s*[^\s>]*/gi, '');
    
    // Remove dangerous attributes
    sanitized = sanitized.replace(/\s(style|onload|onerror|onclick|onmouseover|onfocus|onblur)\s*=\s*["'][^"']*["']/gi, '');
    
    // Remove iframe, object, embed tags that could execute code
    sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
    sanitized = sanitized.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
    sanitized = sanitized.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
    
    // Use Angular's DomSanitizer to further sanitize
    // SecurityContext.HTML = 1
    const fullySanitized = this._sanitizer.sanitize(1, sanitized) || '';
    
    return fullySanitized;
  }
  generatePdf(): void {
    const formModel = this.formCourseOffered.getRawValue();
    const hasDateRange = formModel.startDate && formModel.endDate;
    const hasRequiredFields = formModel.termId && formModel.termYear && formModel.batchCode;
    const hasStudentId = !!(formModel.studentId && formModel.studentId.toString().trim());
    
    // Validate based on conditional rules
    if (hasDateRange || hasRequiredFields || hasStudentId) {
      this.tbLoading = true;
      this.hasSearched = true;
      const startDate = formModel.startDate ? this.formatDate(formModel.startDate) : '';
      const endDate = formModel.endDate ? this.formatDate(formModel.endDate) : '';
      const studentId = formModel.studentId ? formModel.studentId.toString().trim() : null;
      const batchCode = formModel.batchCode || null;
      
      this._studentService.getListOfTermRegisteredCourseList(batchCode, startDate, endDate, studentId)
        .subscribe({
          next: (res) => {
            this.tbLoading = false;
            this._pdfExportService.generateRegistrationSlipsPdf(res);
          },
          error: () => {
            this.tbLoading = false;
          }
        });
    }
  }
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  getCourseDetails(data: any): any[] {
    if (data.courses && data.courses.length > 0) {
      const courseDetails = data.courses.map((c, index) => {
        return {
          number: index + 1,
          title: c.courseTitle,
          code: c.courseCode,
          creditHours: c.creditHours,
          amount: c.totalAmount,
          courseId: c.id,
        };
      });
      return courseDetails;
    }
    return [];
  }
  getTotalCreditHours(data: any): number {
    if (data.courses && data.courses.length > 0) {
      return data.courses.reduce((sum, course) => sum + course.creditHours, 0);
    }
    return 0;
  }
  getTotalAmount(data: any): number {
    if (data.courses && data.courses.length > 0) {
      return data.courses.reduce((sum, course) => sum + course.totalAmount, 0);
    }
    return 0;
  }

  getPaymentDetails(data: any): CoursePaymentViewModel[] {
    if (data.payments && data.payments.length > 0) {
      return data.payments;
    }
    return [];
  }

  getTotalPaymentAmount(data: any): number {
    if (data.payments && data.payments.length > 0) {
      return data.payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    }
    return 0;
  }

  formatToBank(toBank: number): string {
    if (!toBank || toBank === 0) return '-';
    const bankNames: { [key: number]: string } = {
      1: 'Dashen Bank',
    };
    return bankNames[toBank] || toBank.toString();
  }

  sort(column: string, order: string | null): void {
    this.pager.onSort(order, column);
  }

  getRegistrationSlips(): void {
    this.loadData(true);
  }
  getFileName(fileName: string) {
    if (!fileName) return;
    const profilePicture =
      environment.fileUrl +
      "/Resources/coursepayment/" +
      fileName;
    window.open(profilePicture, '_blank');
  }

  toggleFormCollapse(): void {
    this.isFormCollapsed = !this.isFormCollapsed;
  }
}
