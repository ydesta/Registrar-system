import { Component, OnDestroy, OnInit } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { BANK_TO } from 'src/app/common/constant';
import { CoursePaymentViewModel } from 'src/app/students/models/course-payment-view-model.model';
import { StudentRegistrationSlipViewModel } from 'src/app/students/models/student-profile-view-model.model';
import { StudentService } from 'src/app/students/services/student.service';
import { environment } from 'src/environments/environment';

interface SlipCourseRow {
  number: number;
  title: string;
  code: string;
  creditHours: number;
  amount: number;
  courseId: any;
  orderNumber?: string;
  bankTransactionId?: string;
  transactionDate?: Date | string;
}

@Component({
  selector: 'app-student-semster-course-registration-slip',
  templateUrl: './student-semster-course-registration-slip.component.html',
  styleUrls: ['./student-semster-course-registration-slip.component.scss']
})
export class StudentSemsterCourseRegistrationSlipComponent implements OnInit, OnDestroy {
  applicantUserId = localStorage.getItem('userId');
  listOdRegisteredStudent: StudentRegistrationSlipViewModel[] = [];
  filteredSlips: StudentRegistrationSlipViewModel[] = [];
  tbLoading = false;
  pageindex = 1;
  totalRecord = 0;
  pageSize = 10;
  pageSizeOption = [5, 10, 15, 25, 50];
  sortOrder = '';
  sortColumn = '';
  expandSet = new Set<string>();
  searchText = '';
  totalCourses = 0;
  totalCredits = 0;
  totalAmount = 0;
  studentName = '';
  studentCode = '';
  batchCode = '';

  private destroy$ = new Subject<void>();
  private search$ = new Subject<string>();
  private courseCache = new Map<string, SlipCourseRow[]>();
  private creditCache = new Map<string, number>();
  private amountCache = new Map<string, number>();

  constructor(private _studentService: StudentService) {}

  ngOnInit(): void {
    this.search$
      .pipe(debounceTime(250), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(text => this.applyFilter(text));
    this.generateRegistrationSlip();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  generateRegistrationSlip(): void {
    if (!this.applicantUserId) {
      return;
    }
    this.tbLoading = true;
    this._studentService.getListOfCourseRegistrationSlipList(this.applicantUserId).subscribe({
      next: res => {
        this.listOdRegisteredStudent = res || [];
        this.clearCaches();
        this.recomputeSummary();
        this.applyFilter(this.searchText);
        this.tbLoading = false;
      },
      error: () => {
        this.listOdRegisteredStudent = [];
        this.filteredSlips = [];
        this.totalRecord = 0;
        this.clearCaches();
        this.recomputeSummary();
        this.tbLoading = false;
      }
    });
  }

  onPageIndexChange(page: number): void {
    this.pageindex = page;
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageindex = 1;
  }

  onExpandChange(key: string, checked: boolean): void {
    if (checked) {
      this.expandSet.add(key);
    } else {
      this.expandSet.delete(key);
    }
  }

  slipKey(data: StudentRegistrationSlipViewModel, index: number): string {
    return `${data.studentCode || 's'}_${data.academicTerm || 't'}_${data.registrationDate || index}`;
  }

  getFileName(fileName: string): void {
    if (!fileName) {
      return;
    }
    window.open(`${environment.fileUrl}/Resources/coursepayment/${fileName}`, '_blank');
  }

  sort(column: string, order: string | null): void {
    this.sortColumn = column;
    this.sortOrder = order || '';
    if (!order) {
      this.applyFilter(this.searchText);
      return;
    }
    const list = [...this.filteredSlips];
    list.sort((a, b) => {
      const aValue = this.getPropertyValue(a, column);
      const bValue = this.getPropertyValue(b, column);
      if (aValue === bValue) {
        return 0;
      }
      if (order === 'ascend') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });
    this.filteredSlips = list;
  }

  private getPropertyValue(obj: any, property: string): any {
    switch (property) {
      case 'academicTerm':
        return (obj.academicTerm || '').toString().toLowerCase();
      case 'registrationDate':
        return new Date(obj.registrationDate || 0).getTime();
      case 'fromBank':
        return obj.fromBank || '';
      case 'toBank':
        return obj.toBank || '';
      case 'bankTransactionId':
        return obj.bankTransactionId || '';
      case 'orderNumber':
        return (obj.orderNumber || '').toString().toLowerCase();
      default:
        return '';
    }
  }

  getCourseDetails(data: StudentRegistrationSlipViewModel, index: number): SlipCourseRow[] {
    const key = this.slipKey(data, index);
    if (this.courseCache.has(key)) {
      return this.courseCache.get(key);
    }
    const courses = (data.courses || []).map((c, i) => ({
      number: i + 1,
      title: c.courseTitle,
      code: c.courseCode,
      creditHours: c.creditHours || 0,
      amount: c.totalAmount || 0,
      courseId: c.id,
      orderNumber: c.orderNumber,
      bankTransactionId: c.bankTransactionId,
      transactionDate: c.transactionDate
    }));
    this.courseCache.set(key, courses);
    return courses;
  }

  getPaymentDetails(data: StudentRegistrationSlipViewModel): CoursePaymentViewModel[] {
    return data?.payments || [];
  }

  formatToBank(toBank: number): string {
    if (toBank == null) {
      return '—';
    }
    const bank = BANK_TO.find(item => Number(item.Id) === Number(toBank));
    return bank ? bank.Description : String(toBank);
  }

  getTotalCreditHours(data: StudentRegistrationSlipViewModel, index: number): number {
    const key = this.slipKey(data, index);
    if (this.creditCache.has(key)) {
      return this.creditCache.get(key);
    }
    const total = (data.courses || []).reduce((sum, course) => sum + (course.creditHours || 0), 0);
    this.creditCache.set(key, total);
    return total;
  }

  getSlipAmount(data: StudentRegistrationSlipViewModel, index: number): number {
    const key = this.slipKey(data, index);
    if (this.amountCache.has(key)) {
      return this.amountCache.get(key);
    }
    const total = (data.courses || []).reduce((sum, course) => sum + (course.totalAmount || 0), 0);
    this.amountCache.set(key, total);
    return total;
  }

  onSearch(value?: string): void {
    const text = value !== undefined ? value : this.searchText;
    this.searchText = text || '';
    this.search$.next(this.searchText.trim().toLowerCase());
  }

  trackBySlip = (_: number, student: StudentRegistrationSlipViewModel): string =>
    `${student.studentCode}_${student.academicTerm}_${student.registrationDate}`;

  refreshData(): void {
    this.generateRegistrationSlip();
  }

  downloadStudentSlip(slip: StudentRegistrationSlipViewModel): void {
    const doc = new jsPDF();
    const slipHeight = 95;

    for (let copy = 0; copy < 3; copy++) {
      const yOffset = 10 + copy * slipHeight;
      doc.setFontSize(12);
      doc.setTextColor(9, 62, 150);
      doc.text(
        `HiLCoE Registration ${slip.academicTerm}/Offer Batch ${slip.offeredBatchCode}`,
        105,
        yOffset + 4,
        { align: 'center' }
      );
      doc.setDrawColor(9, 62, 150);
      doc.setLineWidth(0.7);
      doc.line(20, yOffset + 7, 190, yOffset + 7);

      doc.setDrawColor(41, 128, 185);
      doc.setFillColor(240, 248, 255);
      doc.roundedRect(25, yOffset + 10, 160, 38, 2, 2, 'FD');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Student Name:', 30, yOffset + 16);
      doc.text('Student ID:', 30, yOffset + 21);
      doc.text('Academic Term:', 110, yOffset + 16);
      doc.text('Own Batch:', 110, yOffset + 21);
      doc.setFont('helvetica', 'normal');
      doc.text(slip.fullName || '', 60, yOffset + 16);
      doc.text(slip.studentCode || '', 60, yOffset + 21);
      doc.text(slip.academicTerm || '', 145, yOffset + 16);
      doc.text(slip.owenBatchCode || '', 145, yOffset + 21);

      doc.setFont('helvetica', 'bold');
      doc.text('Bank:', 30, yOffset + 26);
      doc.setFont('helvetica', 'normal');
      doc.text(`From: ${slip.fromBank || '-'} To: ${slip.toBank || '-'}`, 60, yOffset + 26);

      doc.setFont('helvetica', 'bold');
      doc.text('FS NO.:', 30, yOffset + 31);
      doc.setFont('helvetica', 'normal');
      doc.text('____________________', 60, yOffset + 31);

      doc.setFont('helvetica', 'bold');
      doc.text('Payment Order #:', 30, yOffset + 36);
      doc.setFont('helvetica', 'normal');
      doc.text(slip.orderNumber || '-', 60, yOffset + 36);

      doc.setFont('helvetica', 'bold');
      doc.text('Bank Transaction Id .:', 110, yOffset + 26);
      doc.setFont('helvetica', 'normal');
      doc.text(slip.bankTransactionId || '-', 145, yOffset + 26);

      doc.setFont('helvetica', 'bold');
      doc.text('Registration Date:', 110, yOffset + 31);
      doc.setFont('helvetica', 'normal');
      doc.text(slip.registrationDate || '-', 145, yOffset + 31);

      autoTable(doc, {
        startY: yOffset + 50,
        margin: { left: 25, right: 25 },
        head: [['Course Code', 'Course Title', 'Cr.', 'Amount', 'Order #', 'Transaction ID', 'Tx Date']],
        body: (slip.courses || []).map(c => [
          c.courseCode,
          c.courseTitle,
          c.creditHours,
          c.totalAmount,
          c.orderNumber || '-',
          c.bankTransactionId || '-',
          c.transactionDate ? new Date(c.transactionDate).toLocaleDateString('en-GB') : '-'
        ]),
        foot: [[
          '',
          'Total',
          (slip.courses || []).reduce((sum, c) => sum + (c.creditHours || 0), 0),
          (slip.courses || []).reduce((sum, c) => sum + (c.totalAmount || 0), 0),
          '',
          '',
          ''
        ]],
        theme: 'grid',
        headStyles: { fillColor: [9, 62, 150], textColor: 255, fontSize: 7 },
        footStyles: { fillColor: [245, 245, 245], textColor: 0, fontStyle: 'bold', fontSize: 7 },
        styles: { fontSize: 7, cellPadding: 1.2 },
        alternateRowStyles: { fillColor: [245, 250, 255] },
        columnStyles: {
          2: { halign: 'center' },
          3: { halign: 'center' }
        },
        didParseCell: function (data) {
          if (data.section === 'foot' && (data.column.index === 2 || data.column.index === 3)) {
            data.cell.styles.halign = 'center';
          }
        }
      });

      const sigY = yOffset + slipHeight - 10;
      doc.setDrawColor(9, 62, 150);
      doc.setLineDashPattern([2, 2], 0);
      doc.line(25, sigY, 90, sigY);
      doc.line(120, sigY, 185, sigY);
      doc.setLineDashPattern([], 0);
      doc.setFontSize(8);
      doc.setTextColor(44, 62, 80);
      doc.text('Student Signature', 57.5, sigY + 4, { align: 'center' });
      doc.text('Authorized By', 152.5, sigY + 4, { align: 'center' });
    }

    doc.save(`registration-slip-${slip.studentCode}-${slip.academicTerm}.pdf`);
  }

  private applyFilter(text: string): void {
    const query = (text || '').trim().toLowerCase();
    if (!query) {
      this.filteredSlips = [...this.listOdRegisteredStudent];
    } else {
      this.filteredSlips = this.listOdRegisteredStudent.filter(item => {
        const paymentFields = (item.payments || []).flatMap(p => [
          p.orderNumber,
          p.bankTransactionID,
          p.fromBank
        ]);
        const haystack = [
          item.academicTerm,
          item.registrationDate,
          item.fromBank,
          item.toBank,
          item.bankTransactionId,
          item.orderNumber,
          item.fullName,
          item.studentCode,
          ...paymentFields
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(query);
      });
    }
    this.totalRecord = this.filteredSlips.length;
    this.pageindex = 1;
  }

  private recomputeSummary(): void {
    const first = this.listOdRegisteredStudent[0];
    this.studentName = first?.fullName || '';
    this.studentCode = first?.studentCode || '';
    this.batchCode = first?.owenBatchCode || '';
    this.totalCourses = 0;
    this.totalCredits = 0;
    this.totalAmount = 0;
    for (const slip of this.listOdRegisteredStudent) {
      const courses = slip.courses || [];
      this.totalCourses += courses.length;
      for (const course of courses) {
        this.totalCredits += course.creditHours || 0;
        this.totalAmount += course.totalAmount || 0;
      }
    }
  }

  private clearCaches(): void {
    this.courseCache.clear();
    this.creditCache.clear();
    this.amountCache.clear();
    this.expandSet.clear();
  }
}
