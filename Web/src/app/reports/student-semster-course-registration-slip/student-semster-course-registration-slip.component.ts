import { Component, OnInit } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StudentRegistrationSlipViewModel } from 'src/app/students/models/student-profile-view-model.model';
import { StudentService } from 'src/app/students/services/student.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-student-semster-course-registration-slip',
  templateUrl: './student-semster-course-registration-slip.component.html',
  styleUrls: ['./student-semster-course-registration-slip.component.scss']
})
export class StudentSemsterCourseRegistrationSlipComponent implements OnInit {
  applicantUserId = localStorage.getItem('userId');
  listOdRegisteredStudent: StudentRegistrationSlipViewModel[] = [];
  tbLoading = false;
  pageindex = 1;
  totalRecord = 0;
  pageSize = 10;
  pageSizeOption = [5, 10, 15, 25, 50, 100];
  sortOrder = "";
  sortColumn = "";
  expandSet = new Set<string>();
  searchText = "";
  constructor(private _studentService: StudentService) {

  }

  ngOnInit(): void {
    this.generateRegistrationSlip();
  }
  generateRegistrationSlip() {
    if (this.applicantUserId) {
      this._studentService.getListOfCourseRegistrationSlipList(this.applicantUserId).subscribe(res => {
        this.listOdRegisteredStudent = res;
      })
    }
  }
  onPageIndexChange(page: number): void {
    this.pageindex = page;
    this.generateRegistrationSlip();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageindex = 1;
    this.generateRegistrationSlip();
  }
  onExpandChange(id: string, checked: boolean): void {
    if (checked) {
      this.expandSet.add(id);
    } else {
      this.expandSet.delete(id);
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
  getTotalAmount(data?: any): number {
    if (data) {
      if (data.courses && data.courses.length > 0) {
        return data.courses.reduce((sum, course) => sum + course.totalAmount, 0);
      }
      return 0;
    } else {
      // Calculate total for all students
      return this.listOdRegisteredStudent.reduce((total, student) => {
        return total + this.getTotalAmount(student);
      }, 0);
    }
  }

  getTotalCourses(): number {
    return this.listOdRegisteredStudent.reduce((total, student) => {
      return total + (student.courses ? student.courses.length : 0);
    }, 0);
  }

  getTotalCredits(): number {
    return this.listOdRegisteredStudent.reduce((total, student) => {
      return total + this.getTotalCreditHours(student);
    }, 0);
  }

  onSearch(): void {
    // Implement search functionality
    this.pageindex = 1;
    this.generateRegistrationSlip();
  }

  trackByStudentCode(index: number, student: any): string {
    return student.studentCode || index;
  }

  printSlip(): void {
    window.print();
  }

  downloadPDF(): void {
    // Implement PDF download functionality
    console.log('Downloading PDF...');
  }

  viewStudentCourses(data: any): void {
    // Implement view student courses functionality
    console.log('Viewing courses for:', data.fullName);
  }

  downloadStudentReport(data: any): void {
    // Implement download student report functionality
    console.log('Downloading report for:', data.fullName);
  }

  printStudentSlip(data: any): void {
    // Implement print specific student slip functionality
    console.log('Printing slip for:', data.fullName);
    // You can implement specific print functionality for individual student slip here
    window.print();
  }



  refreshData(): void {
    this.generateRegistrationSlip();
  }
  downloadStudentSlip(slip: StudentRegistrationSlipViewModel): void {
    const doc = new jsPDF();
    const slipHeight = 95; 

    // Generate 3 copies of the slip
    for (let copy = 0; copy < 3; copy++) {
      const yOffset = 10 + copy * slipHeight;
      doc.setFontSize(12);
      doc.setTextColor(9, 62, 150);
      doc.text(`HiLCoE Registration ${slip.academicTerm}`, 105, yOffset + 4, { align: 'center' });
      doc.setDrawColor(9, 62, 150);
      doc.setLineWidth(0.7);
      doc.line(20, yOffset + 7, 190, yOffset + 7);

      doc.setDrawColor(41, 128, 185);
      doc.setFillColor(240, 248, 255);
      doc.roundedRect(25, yOffset + 10, 160, 28, 2, 2, 'FD');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Student Name:', 30, yOffset + 16);
      doc.text('Student ID:', 30, yOffset + 21);
      doc.text('Academic Term:', 110, yOffset + 16);
      doc.text('Batch Code:', 110, yOffset + 21);
      doc.setFont('helvetica', 'normal');
      doc.text(slip.fullName, 60, yOffset + 16);
      doc.text(slip.studentCode, 60, yOffset + 21);
      doc.text(slip.academicTerm, 145, yOffset + 16);
      doc.text(slip.batchCode, 145, yOffset + 21);

      // Info box two-column layout for extra fields
      // First row (left)
      doc.setFont('helvetica', 'bold');
      doc.text('Bank:', 30, yOffset + 26);
      doc.setFont('helvetica', 'normal');
      doc.text(`From: ${slip.fromBank} To: ${slip.toBank}`, 60, yOffset + 26);

      doc.setFont('helvetica', 'bold');
      doc.text('FS NO.:', 30, yOffset + 31);
      doc.setFont('helvetica', 'normal');
      doc.text('____________________', 60, yOffset + 31);

      // First row (right)
      doc.setFont('helvetica', 'bold');
      doc.text('Bank Transaction Id .:', 110, yOffset + 26);
      doc.setFont('helvetica', 'normal');
      doc.text(slip.bankTransactionId, 145, yOffset + 26);

      doc.setFont('helvetica', 'bold');
      doc.text('Registration Date:', 110, yOffset + 31);
      doc.setFont('helvetica', 'normal');
      doc.text(slip.registrationDate, 145, yOffset + 31);

      // Table (move up to follow the info box, now below the larger card)
      autoTable(doc, {
        startY: yOffset + 40,
        margin: { left: 25, right: 25 },
        head: [['Course Code', 'Course Title', 'Credit Hours', 'Total Amount']],
        body: slip.courses.map(c => [
          c.courseCode, c.courseTitle, c.creditHours, c.totalAmount
        ]),
        foot: [[
          '', 'Total',
          slip.courses.reduce((sum, c) => sum + c.creditHours, 0),
          slip.courses.reduce((sum, c) => sum + c.totalAmount, 0)
        ]],
        theme: 'grid',
        headStyles: { fillColor: [9, 62, 150], textColor: 255, fontSize: 8 },
        footStyles: { fillColor: [245, 245, 245], textColor: 0, fontStyle: 'bold', fontSize: 8 },
        styles: { fontSize: 8, cellPadding: 1.5 },
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

      // Signature lines and labels on the same row, with top padding
      const sigY = yOffset + slipHeight - 10; // More top padding
      doc.setDrawColor(9, 62, 150);
      doc.setLineDashPattern([2, 2], 0);
      doc.line(25, sigY, 90, sigY);   // Student Signature line
      doc.line(120, sigY, 185, sigY); // Authorized By line
      doc.setLineDashPattern([], 0);
      doc.setFontSize(8);
      doc.setTextColor(44, 62, 80);
      // Place the labels BELOW the lines
      const labelBelowOffset = 4;
      doc.text('Student Signature', 57.5, sigY + labelBelowOffset, { align: 'center' });
      doc.text('Authorized By', 152.5, sigY + labelBelowOffset, { align: 'center' });
    }

    doc.save(`registration-slip-${slip.studentCode}-${slip.academicTerm}.pdf`);
  }
}
