import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StaticData } from 'src/app/admission-request/model/StaticData';
import { TermCourseOfferingService } from 'src/app/colleges/services/term-course-offering.service';
import { ACADEMIC_TERM_STATUS } from 'src/app/common/constant';
import { PdfExportService } from '../services/pdf-export.service';
import { StudentService } from 'src/app/students/services/student.service';
import { StudentRegistrationSlipViewModel } from 'src/app/students/models/student-profile-view-model.model';
import { environment } from 'src/environments/environment.prod';

@Component({
  selector: 'app-academic-term-registration-slip',
  templateUrl: './academic-term-registration-slip.component.html',
  styleUrls: ['./academic-term-registration-slip.component.scss']
})
export class AcademicTermRegistrationSlipComponent implements OnInit {
  listOfTermNumber: StaticData[] = [];
  yearList: number[] = [];
  formCourseOffered: FormGroup;
  listOfBatch: any[] = [];
  expandSet = new Set<string>();
  tbLoading = false;
  pageindex = 1;
  totalRecord = 0;
  pageSize = 10;
  pageSizeOption = [5, 10, 15, 25, 50, 100];
  sortOrder = "";
  sortColumn = "";
  listOdRegisteredStudent: StudentRegistrationSlipViewModel[] = [];
  isFormCollapsed = false;
  hasSearched = false;

  constructor(private courseTermOfferingService: TermCourseOfferingService,
    private _pdfExportService: PdfExportService,
    private _fb: FormBuilder,
    private _studentService: StudentService
  ) {
    const currentYear = new Date();
    this.yearList = this.getYearRange(currentYear.getFullYear());
    this.getListOfAcademicTermStatus();
    this.createCourseOffering();
  }

  ngOnInit(): void {
    this.termId.valueChanges.subscribe(res => {
      if (res) {
        this.termYear.valueChanges.subscribe(year => {
          if (year) {
            this.getListOfBatch(res, year);
          }
        })
      }
    });

  }
  private createCourseOffering() {
    this.formCourseOffered = this._fb.group({
      termId: [null, [Validators.required]],
      termYear: [null, [Validators.required]],
      batchCode: [null, [Validators.required]],
      startDate: [null],
      endDate: [null],
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
  onPageIndexChange(page: number): void {
    this.pageindex = page;
    this.loadData();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageindex = 1;
    this.loadData();
  }

  private loadData(): void {
    const formModel = this.formCourseOffered.getRawValue();
    if (formModel.termId && formModel.termYear && formModel.batchCode) {
      this.tbLoading = true;
      this.hasSearched = true;
      const startDate = formModel.startDate ? this.formatDate(formModel.startDate) : '';
      const endDate = formModel.endDate ? this.formatDate(formModel.endDate) : '';
      this._studentService.getListOfTermRegisteredCourseList(formModel.batchCode, startDate, endDate)
        .subscribe({
          next: (res) => {
            this.listOdRegisteredStudent = res;
            this.totalRecord = res.length;
            this.tbLoading = false;
          },
          error: (error) => {
            console.error('Error loading data:', error);
            this.tbLoading = false;
          }
        });
    }
  }

  public resetData(): void {
    this.formCourseOffered.reset();
    this.listOdRegisteredStudent = [];
    this.totalRecord = 0;
    this.hasSearched = false;
    this.isFormCollapsed = false;
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
      const blob = new Blob([element.innerHTML], { type: 'text/html' });
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
  generatePdf(): void {
    const formModel = this.formCourseOffered.getRawValue();
    //if (formModel.termId && formModel.termYear && formModel.batchCode) {
      this.tbLoading = true;
      this.hasSearched = true;
      const startDate = formModel.startDate ? this.formatDate(formModel.startDate) : '';
      const endDate = formModel.endDate ? this.formatDate(formModel.endDate) : '';
      console.log("%%%%           ", formModel.batchCode);
      this._studentService.getListOfTermRegisteredCourseList(formModel.batchCode, startDate, endDate)
        .subscribe({
          next: (res) => {
            this.listOdRegisteredStudent = res;

            this.totalRecord = res.length;
            this.tbLoading = false;
            this.isFormCollapsed = true;
            this._pdfExportService.generateRegistrationSlipsPdf(res);
          },
          error: (error) => {
            console.error('Error generating PDF:', error);
            this.tbLoading = false;
          }
        });
    // } else {
    //   console.error('Please select all required fields before generating PDF.');
    // }
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

  sort(column: string, order: string | null): void {
    this.sortColumn = column;
    this.sortOrder = order || '';

    if (order) {
      this.listOdRegisteredStudent.sort((a, b) => {
        const aValue = this.getPropertyValue(a, column);
        const bValue = this.getPropertyValue(b, column);

        if (order === 'ascend') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    }
  }
  getFileName(fileName: string) {
    if (!fileName) return;
    const profilePicture =
      environment.fileUrl +
      "/Resources/coursepayment/" +
      fileName;
    window.open(profilePicture, '_blank');
  }
  private getPropertyValue(obj: any, property: string): any {
    switch (property) {
      case 'studentCode':
        return obj.studentCode || '';
      case 'fullName':
        return obj.fullName || '';
      case 'registrationDate':
        return new Date(obj.registrationDate || '');
      case 'fromBank':
        return obj.fromBank || '';
      case 'toBank':
        return obj.toBank || '';
      case 'bankTransactionId':
        return obj.bankTransactionId || '';
      default:
        return '';
    }
  }

  toggleFormCollapse(): void {
    this.isFormCollapsed = !this.isFormCollapsed;
  }
}
