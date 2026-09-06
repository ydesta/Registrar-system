// Updated PDF Export Service with working page numbers
import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable, { RowInput } from 'jspdf-autotable';
import { StudentRegistrationSlipViewModel } from 'src/app/students/models/student-profile-view-model.model';
import { StudentTranscriptViewModel } from '../model/student-transcript-view-model.model';
import { StudentGradeReportViewModel } from '../model/student-grade-report-view-model.model';

@Injectable({
  providedIn: 'root'
})
export class PdfExportService {
  exportToPdf(headerLines: string[], tableHeaders: string[], tableData: RowInput[], fileName: string): void {
    const doc = new jsPDF();
    let yPosition = 10;

    // Add header lines
    headerLines.forEach((line, index) => {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(line, 14, yPosition + (index * 10));
    });

    // Add table
    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      startY: yPosition + (headerLines.length * 10) + 5,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      didDrawPage: () => {
        // Empty callback to ensure proper page tracking
      }
    });

    // Add page numbers after table is fully drawn
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const pageSize = doc.internal.pageSize;
      doc.text(
        `Page ${i} of ${totalPages}`,
        pageSize.width - 40,
        pageSize.height - 10,
        { align: 'right' }
      );
    }

    doc.save(`${fileName}_${new Date().getTime()}.pdf`);
  }

  generateRegistrationSlipsPdf(slips: StudentRegistrationSlipViewModel[]): void {
    const doc = new jsPDF();
    const slipHeight = 85;

    const isValidId = (value?: string | null): boolean => {
      const trimmed = (value || '').trim();
      return !!trimmed && trimmed !== '-';
    };

    const getAllOrderNumbers = (slip: StudentRegistrationSlipViewModel): string[] => {
      const orderNumbers: string[] = [];
      if (isValidId(slip.orderNumber)) {
        orderNumbers.push(slip.orderNumber.trim());
      }
      (slip.payments || []).forEach(payment => {
        if (isValidId(payment.orderNumber)) {
          const orderNo = payment.orderNumber.trim();
          if (!orderNumbers.includes(orderNo)) {
            orderNumbers.push(orderNo);
          }
        }
      });
      return orderNumbers.length > 0 ? orderNumbers : ['-'];
    };

    const getAllTransactionIds = (slip: StudentRegistrationSlipViewModel): string[] => {
      const orderNumbers = new Set(
        getAllOrderNumbers(slip).filter(v => v !== '-').map(v => v.toUpperCase())
      );
      const transactionIds: string[] = [];

      const pushTx = (value?: string | null) => {
        if (!isValidId(value)) {
          return;
        }
        const txId = value.trim();
        if (orderNumbers.has(txId.toUpperCase())) {
          return;
        }
        if (!transactionIds.includes(txId)) {
          transactionIds.push(txId);
        }
      };

      pushTx(slip.bankTransactionId);
      (slip.payments || []).forEach(payment => pushTx(payment.bankTransactionID));

      return transactionIds.length > 0 ? transactionIds : ['-'];
    };

    slips.forEach((slip, studentIndex) => {
      for (let copy = 0; copy < 3; copy++) {
        const yOffset = 8 + copy * slipHeight;
        const orderNumbers = getAllOrderNumbers(slip);
        const transactionIds = getAllTransactionIds(slip);
        const extraLines = Math.max(orderNumbers.length, transactionIds.length) - 1;
        const infoBoxHeight = 28 + Math.max(0, extraLines) * 4;

        doc.setFontSize(10);
        doc.setTextColor(9, 62, 150);
        doc.text(`HiLCoE Registration ${slip.academicTerm}/Offer Batch ${slip.offeredBatchCode}`, 105, yOffset + 3, { align: 'center' });
        doc.setDrawColor(9, 62, 150);
        doc.setLineWidth(0.5);
        doc.line(20, yOffset + 6, 190, yOffset + 6);

        doc.setDrawColor(41, 128, 185);
        doc.setFillColor(240, 248, 255);
        doc.roundedRect(25, yOffset + 8, 160, infoBoxHeight, 2, 2, 'FD');
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text('Student Name:', 30, yOffset + 13);
        doc.text('Student ID:', 30, yOffset + 17);
        doc.text('Academic Term:', 110, yOffset + 13);
        doc.text('Own Batch:', 110, yOffset + 17);
        doc.setFont('helvetica', 'normal');
        doc.text(slip.fullName || '', 60, yOffset + 13);
        doc.text(slip.studentCode || '', 60, yOffset + 17);
        doc.text(slip.academicTerm || '', 145, yOffset + 13);
        doc.text(slip.owenBatchCode || '', 145, yOffset + 17);

        doc.setFont('helvetica', 'bold');
        doc.text('Bank:', 30, yOffset + 21);
        doc.setFont('helvetica', 'normal');
        doc.text(`From: ${slip.fromBank || ''} To: ${slip.toBank || ''}`, 60, yOffset + 21);

        doc.setFont('helvetica', 'bold');
        doc.text('Registration Date:', 110, yOffset + 21);
        doc.setFont('helvetica', 'normal');
        doc.text(slip.registrationDate || '', 145, yOffset + 21);

        doc.setFont('helvetica', 'bold');
        doc.text('FS NO.:', 30, yOffset + 25);
        doc.setFont('helvetica', 'normal');
        doc.text('____________________', 60, yOffset + 25);

        doc.setFont('helvetica', 'bold');
        doc.text('Payment Order #:', 30, yOffset + 29);
        doc.setFont('helvetica', 'normal');
        doc.text(orderNumbers[0], 60, yOffset + 29);
        for (let i = 1; i < orderNumbers.length; i++) {
          doc.text(orderNumbers[i], 60, yOffset + 29 + (i * 4));
        }

        doc.setFont('helvetica', 'bold');
        doc.text('Bank Transaction Id:', 110, yOffset + 29);
        doc.setFont('helvetica', 'normal');
        doc.text(transactionIds[0], 145, yOffset + 29);
        for (let i = 1; i < transactionIds.length; i++) {
          doc.text(transactionIds[i], 145, yOffset + 29 + (i * 4));
        }

        const maxHeaderY = yOffset + 29 + Math.max(0, extraLines) * 4 + 4;

        autoTable(doc, {
          startY: maxHeaderY + 4,
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
          headStyles: { fillColor: [9, 62, 150], textColor: 255, fontSize: 6 },
          footStyles: { fillColor: [245, 245, 245], textColor: 0, fontStyle: 'bold', fontSize: 6 },
          styles: { fontSize: 6, cellPadding: 1 },
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
        const sigY = yOffset + slipHeight - 8; // Reduced from 10 to 8
        doc.setDrawColor(9, 62, 150);
        doc.setLineDashPattern([2, 2], 0);
        doc.line(25, sigY, 90, sigY);   // Student Signature line
        doc.line(120, sigY, 185, sigY); // Authorized By line
        doc.setLineDashPattern([], 0);
        doc.setFontSize(6); // Reduced from 8 to 6
        doc.setTextColor(44, 62, 80);
        // Place the labels BELOW the lines
        const labelBelowOffset = 3; // Reduced from 4 to 3
        doc.text('Student Signature', 57.5, sigY + labelBelowOffset, { align: 'center' });
        doc.text('Authorized By', 152.5, sigY + labelBelowOffset, { align: 'center' });
      }
      // New page for next student, unless last
      if (studentIndex < slips.length - 1) doc.addPage();
    });

    doc.save('registration-slips.pdf');
  }

  exportTranscript(transcript: StudentTranscriptViewModel, fileName: string): void {
    const doc = new jsPDF({
      unit: 'pt',
      format: 'letter',
      orientation: 'landscape'
    });
    this.drawWatermark(doc);
    let cursorY = this.drawHeader(doc, transcript);

    cursorY += 10;

    this.drawAcademicTermsTwoColumns(doc, transcript.academicTerms, cursorY + 5, transcript);
    this.drawSignaturePage(doc);
    doc.save(fileName);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // WATERMARK
  // ─────────────────────────────────────────────────────────────────────────────
  private drawWatermark(doc: jsPDF): void {
    
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // HEADER
  // ─────────────────────────────────────────────────────────────────────────────
  private drawHeader(doc: jsPDF, transcript?: StudentTranscriptViewModel): number {
    const y = 30;
    const pageWidth = doc.internal.pageSize.getWidth();
    const headerWidth = pageWidth - 30;

    // Draw header background rectangle
    doc.setFillColor(240, 240, 240);
    doc.rect(15, y - 15, headerWidth, 110, 'F');

    // Institution name with enhanced styling
    doc.setFont('helvetica', 'bold').setFontSize(22);
    doc.setTextColor(0, 0, 0);
    doc.text('HiLCoE', 20, y - 8);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('School of Computer Science & Technology', 20, y + 8);

    // Contact information with subtle styling
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text('Tel. (+251-111) 559769, 564900', 20, y + 24);
    doc.text('P.O.Box 25304/1000', 20, y + 36);
    doc.text('e-mail: info@hilcoe.net', 20, y + 48);

    // Add medium of instruction in header
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Medium of instruction: English', 20, y + 60);

    // Right side - Student information (if transcript is provided)
    if (transcript) {
      const rightX = pageWidth - 220;
      let studentY = y - 8;

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      studentY += 12;

      const dob = transcript.dateOfBirth
        ? new Date(transcript.dateOfBirth).toLocaleDateString()
        : 'January 15, 1983';

      const award = transcript.awardDate
        ? new Date(transcript.awardDate).toLocaleDateString()
        : 'August 15, 2015';

      doc.text(`Full Name: ${transcript.fullName}`, rightX, studentY);
      studentY += 14;
      doc.text(`Gender: ${transcript.gender || 'Male'}`, rightX, studentY);
      studentY += 14;
      doc.text(`Date of Birth: ${dob}`, rightX, studentY);
      studentY += 14;
      doc.text(`Place of Birth: ${transcript.placeOfBirth || 'Wukro'}`, rightX, studentY);
      studentY += 14;

      let admissionDateFormatted = 'September 2012';
      if (transcript.admissionDate) {
        try {
          const date = new Date(transcript.admissionDate);
          const day = date.getDate();
          const month = date.toLocaleDateString('en-US', { month: 'long' });
          const year = date.getFullYear();
          admissionDateFormatted = `${day}-${month}-${year}`;
        } catch (error) {
          admissionDateFormatted = 'September 2012';
        }
      }
      doc.text(`Admission Date: ${admissionDateFormatted}`, rightX, studentY);

      const leftEndX = 220;
      const rightStartX = rightX;
      const centerX = (leftEndX + rightStartX) / 2 - 40;
      studentY = y + 2;

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);

      const programmeText = `Programme: ${transcript.programme || 'BSc degree in Computer Science'}`;
      const maxWidth = 160;
      const programmeLines = doc.splitTextToSize(programmeText, maxWidth);
      programmeLines.forEach((line: string, index: number) => {
        doc.text(line, centerX, studentY + (index * 10));
      });
      studentY += (programmeLines.length * 10) + 4;

      doc.text(`Division: ${transcript.division || 'Day'}`, centerX, studentY);
      studentY += 14;
      doc.text(`Status: ${transcript.status || 'Regular'}`, centerX, studentY);
      studentY += 14;
      doc.text(`Major: ${transcript.major || 'Computer Science'}`, centerX, studentY);
      studentY += 14;
      doc.text(`Award Date: ${award}`, centerX, studentY);
    }

    return y + 105;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STUDENT + PROGRAM INFO
  // ─────────────────────────────────────────────────────────────────────────────
  private drawStudentAndProgramInfo(
    doc: jsPDF,
    t: StudentTranscriptViewModel,
    startY: number
  ): number {
    const rightX = 300;
    let y = startY + 10; // Added extra spacing from header

    // labels
    doc.setFont('helvetica', 'bold').setFontSize(10);
    doc.setTextColor(0, 0, 0); // Ensure black text
    ['Full Name:', 'Gender:', 'Date of Birth:', 'Place of Birth:', 'Admission Date:']
      .forEach((label, i) => doc.text(label, rightX, y + i * 12)); // Increased spacing

    // values
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0); // Ensure black text
    const dob = t.dateOfBirth
      ? new Date(t.dateOfBirth).toLocaleDateString()
      : 'January 15, 1983';
    [t.fullName, t.gender || 'Male', dob, t.placeOfBirth || 'Wukro', t.admissionDate || 'September 2012']
      .forEach((value, i) => doc.text(String(value), rightX + 80, y + i * 12)); // Increased spacing

    // now program details, 50pt below (increased spacing)
    y += 50;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0); // Ensure black text
    ['Programme:', 'Division:', 'Status:', 'Major:', 'Award Date:']
      .forEach((label, i) => doc.text(label, rightX, y + i * 12)); // Increased spacing
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0); // Ensure black text
    const award = t.awardDate
      ? new Date(t.awardDate).toLocaleDateString()
      : 'August 15, 2018';
    [t.programme || 'BSc degree in Computer Science', t.division || 'Day',
     t.status || 'Regular', t.major || 'Computer Science', award]
      .forEach((value, i) => doc.text(String(value), rightX + 80, y + i * 12)); // Increased spacing

    return y + 50; // Increased return spacing
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MEDIUM OF INSTRUCTION
  // ─────────────────────────────────────────────────────────────────────────────
  private drawMediumOfInstruction(doc: jsPDF, y: number): void {
    doc.setFont('helvetica', 'bold').setFontSize(10)
       .text('Medium of instruction: English', 20, y);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ACADEMIC TERMS: 6 TABLES PER PAGE (2 columns × 3 rows)
  // ─────────────────────────────────────────────────────────────────────────────
  private drawAcademicTermsTwoColumns(
    doc: jsPDF,
    terms: any[] = [],
    startY: number,
    transcript?: StudentTranscriptViewModel
  ): void {
    const TABLES_PER_PAGE = 6;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 18;
    const gapX = 16;
    const columnWidth = (pageWidth - margin * 2 - gapX) / 2 - 36;
    const leftX = margin;
    const rightX = margin + columnWidth + gapX + 36;

    for (let pageStart = 0; pageStart < terms.length; pageStart += TABLES_PER_PAGE) {
      if (pageStart > 0) {
        doc.addPage();
        this.drawHeader(doc, transcript);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(0, 0, 0);
      }

      const pageTerms = terms.slice(pageStart, pageStart + TABLES_PER_PAGE);
      const isContinuationPage = pageStart > 0;
      // Tighter bottom gap on page 2+ so tables + signatures fit without an extra page
      const gapY = isContinuationPage ? 16 : 22;
      const contentTop = pageStart === 0 ? startY + 5 : 140;
      let currentY = contentTop;

      for (let i = 0; i < pageTerms.length; i += 2) {
        const term1 = pageTerms[i];
        const term2 = pageTerms[i + 1];
        const maxCourses = Math.max(
          term1?.courses?.length || 0,
          term2?.courses?.length || 0,
          1
        );

        if (term1) {
          this.drawSingleTermTable(doc, term1, leftX, currentY, columnWidth, maxCourses, true);
        }
        if (term2) {
          this.drawSingleTermTable(doc, term2, rightX, currentY, columnWidth, maxCourses, true);
        }

        const lastTable = (doc as any).lastAutoTable;
        currentY = (lastTable?.finalY || currentY + 100) + gapY;
      }
    }
  }

  private calculateTableHeight(courseCount: number, compact = false): number {
    const headerHeight = compact ? 12 : 15;
    const tableHeaderHeight = compact ? 9 : 12;
    const courseRowHeight = compact ? 8 : 10;
    const footerHeight = compact ? 28 : 30;
    const spacing = compact ? 3 : 5;

    return headerHeight + tableHeaderHeight + (courseRowHeight * courseCount) + footerHeight + spacing;
  }

  private drawSingleTermTable(
    doc: jsPDF,
    term: any,
    x: number,
    y: number,
    columnWidth: number,
    targetCourseCount: number = 0,
    compact = false
  ): void {
    // Keep header bar, HR, and table on the same left edge
    const tableLeft = x;
    const tableWidth = columnWidth + 36;
    const headerHeight = compact ? 12 : 15;
    const fontSize = compact ? 6 : 7;
    const minCellHeight = compact ? 7 : 10;
    const cellPadding = compact
      ? { top: 0.5, right: 0.5, bottom: 1, left: 0.5 }
      : { top: 1, right: 1, bottom: 1.5, left: 1 };

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.setDrawColor(0, 0, 0);

    doc.setFillColor(240, 240, 240);
    doc.rect(tableLeft, y - 8, tableWidth, headerHeight, 'F');

    doc.setFont('helvetica', 'bold').setFontSize(compact ? 9 : 11);
    doc.setTextColor(0, 0, 0);
    const termText = `Term: ${term.termName}`;
    const termTextWidth = doc.getTextWidth(termText);
    const centerX = tableLeft + (tableWidth / 2) - (termTextWidth / 2);
    doc.text(termText, centerX, y + (compact ? 1 : 2));

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(tableLeft, y + headerHeight - 2, tableLeft + tableWidth, y + headerHeight - 2);

    const body = (term.courses || []).map((c: any) => [
      c.courseCode,
      c.courseTitle,
      String(c.creditHours),
      c.grade,
      c.gradePoint != null ? Number(c.gradePoint).toFixed(2) : '',
    ]);

    const paddedRowCount = Math.max(targetCourseCount, body.length);
    while (body.length < paddedRowCount) {
      body.push(['', '', '', '', '']);
    }

    const foot = [
      ['', 'Total:', String(term.totalCreditHours ?? term.termTotalCreditHours ?? ''), '', ''],
      ['', 'Average:', term.termGPA != null ? Number(term.termGPA).toFixed(2) : '', '', ''],
      [
        '',
        'Total Credit Hour:',
        term.cumulativeCreditHours != null
          ? Number(term.cumulativeCreditHours).toFixed(2)
          : term.totalCreditHours != null
            ? Number(term.totalCreditHours).toFixed(2)
            : '',
        '',
        ''
      ],
      ['', 'CGPA:', term.cumulativeGPA != null ? Number(term.cumulativeGPA).toFixed(2) : '', '', ''],
      [
        '',
        'Major CGPA:',
        term.cumulativeMajorGPA != null ? Number(term.cumulativeMajorGPA).toFixed(2) : '',
        '',
        ''
      ]
    ];

    // Column widths: keep Credit Hour / Grade Point wide enough that headers don't wrap;
    // remaining width goes to Course Title (no wasted empty space).
    const codeW = compact ? 40 : 48;
    const chW = compact ? 44 : 48;   // fits "Credit Hour"
    const gradeW = compact ? 24 : 28;
    const gpW = compact ? 44 : 48;   // fits "Grade Point"
    const titleW = Math.max(80, tableWidth - (codeW + chW + gradeW + gpW));

    autoTable(doc, {
      head: [['Course Code', 'Course Title', 'Credit Hour', 'Grade', 'Grade Point']],
      body,
      foot,
      startY: y + (compact ? 8 : 12),
      tableWidth,
      margin: {
        left: tableLeft,
        right: doc.internal.pageSize.width - tableLeft - tableWidth
      },
      theme: 'grid',
      styles: {
        fontSize,
        cellPadding,
        font: 'helvetica',
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
        minCellHeight,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize,
        font: 'helvetica',
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
        overflow: 'ellipsize',
        valign: 'middle',
        halign: 'center'
      },
      footStyles: {
        fillColor: [245, 245, 245],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize,
        font: 'helvetica',
        lineColor: [255, 255, 255],
        lineWidth: 0
      },
      columnStyles: {
        0: { cellWidth: codeW, halign: 'left', overflow: 'ellipsize' },
        1: { cellWidth: titleW, halign: 'left', overflow: 'linebreak' },
        2: { cellWidth: chW, halign: 'center', overflow: 'ellipsize' },
        3: { cellWidth: gradeW, halign: 'center', overflow: 'ellipsize' },
        4: { cellWidth: gpW, halign: 'center', overflow: 'ellipsize' }
      },
      didDrawPage: () => {
        const pageCount = doc.getNumberOfPages();
        const pw = doc.internal.pageSize.width;
        const ph = doc.internal.pageSize.height;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`Page ${pageCount}`, pw / 2, ph - 16, { align: 'center' });
      },
      didParseCell: (data) => {
        if (data.section === 'foot' && data.column.index === 1) {
          data.cell.styles.halign = 'right';
        }
        if (data.section === 'foot' && data.column.index === 2) {
          data.cell.styles.halign = 'right';
        }
        if (data.section === 'head') {
          data.cell.styles.overflow = 'ellipsize';
          data.cell.styles.halign = 'center';
        }
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FOOTER
  // ─────────────────────────────────────────────────────────────────────────────
  // private drawFooter(doc: jsPDF): void {
  //   const pageHeight = doc.internal.pageSize.height;
  //   const footerY = pageHeight - 60;
    
  //   doc.setFontSize(9);
  //   doc.setFont('helvetica', 'normal');
  //   doc.text('Grade Scale: A+=4.0, A=4.0, B+=3.5, B=3.0, C+=2.5, C=2.0, D=1.0, F=0.0', 20, footerY);
  //   doc.text('is valid only if it is signed and sealed.', 20, footerY + 8);
  //   doc.text('1 credit hour per term at HiLCOE is equivalent to 0.75 credit hour in semester system', 20, footerY + 16);

  //   // Add circular stamp
  //   const stampX = 105;
  //   const stampY = footerY + 25;
  //   const stampRadius = 15;
    
  //   doc.setDrawColor(0, 100, 200);
  //   doc.setFillColor(240, 248, 255);
  //   doc.circle(stampX, stampY, stampRadius, 'FD');
    
  //   doc.setFontSize(8);
  //   doc.setFont('helvetica', 'bold');
  //   doc.setTextColor(0, 100, 200);
  //   doc.text('HILCOE', stampX, stampY - 8, { align: 'center' });
  //   doc.text('School of Computer Science & Technology', stampX, stampY + 2, { align: 'center' });
  //   doc.setFontSize(6);
  //   doc.text('+251-11-156 4888', stampX, stampY + 8, { align: 'center' });
  //   doc.text('P.O.Box 25304/4000', stampX, stampY + 12, { align: 'center' });
  //   doc.text('Addis Ababa Ethiopia', stampX, stampY + 16, { align: 'center' });

  //   // Add date stamp
  //   doc.setFontSize(10);
  //   doc.setFont('helvetica', 'bold');
  //   doc.setTextColor(0, 100, 200);
  //   const currentDate = new Date().toLocaleDateString('en-US', { 
  //     day: '2-digit', 
  //     month: 'short', 
  //     year: 'numeric' 
  //   }).toUpperCase();
  //   doc.text(currentDate, stampX - 20, stampY - 5);
  // }

  // ─────────────────────────────────────────────────────────────────────────────
  // SIGNATURE PAGE
  // ─────────────────────────────────────────────────────────────────────────────
  private drawSignaturePage(doc: jsPDF): void {
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const pageCount = doc.getNumberOfPages();
    doc.setPage(pageCount);

    const lastTable = (doc as any).lastAutoTable;
    const contentBottom = lastTable?.finalY || 0;
    const signatureBlockHeight = 55; // line + names + titles + date
    const gapAboveSignatures = 12; // compact gap — avoid spawning an extra page
    const bottomPadding = 16;

    const preferredY = pageHeight - bottomPadding - signatureBlockHeight;
    // Always keep signatures on the current last page (no new page)
    const signatureY =
      contentBottom + gapAboveSignatures <= preferredY
        ? preferredY
        : contentBottom + gapAboveSignatures;

    const leftX = 80;
    const rightX = pageWidth - 200;

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(leftX - 20, signatureY, leftX + 80, signatureY);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Mohammed Juhar', leftX, signatureY + 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Chief Registrar', leftX, signatureY + 24);

    doc.line(rightX - 20, signatureY, rightX + 120, signatureY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Abdella Endris', rightX, signatureY + 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Academic Programme Coordinator', rightX, signatureY + 24);

    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${currentDate}`, pageWidth / 2, signatureY + 40, { align: 'center' });
  }

  exportStudentGradeReportToPdf(
    studentGradeReport: StudentGradeReportViewModel,
    fileName: string
  ): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const cardLeftMargin = margin;
    const cardWidth = pageWidth - (margin * 2);
    let currentY = margin;

    const profile = studentGradeReport.studentProfile;
    
    // ========== HEADER DESIGN (Matching Registration Slip Style) ==========
    const headerY = currentY;
    
    // Main Title - Centered, large, dark blue
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(9, 62, 150); // Dark blue color
    doc.text('Student Grade Report', pageWidth / 2, headerY + 8, { align: 'center' });
    
    // Decorative separator lines (two parallel lines)
    // Thicker dark blue line
    doc.setDrawColor(9, 62, 150);
    doc.setLineWidth(0.7);
    doc.line(margin, headerY + 12, pageWidth - margin, headerY + 12);
    
    // Thinner light blue line
    doc.setDrawColor(41, 128, 185);
    doc.setLineWidth(0.3);
    doc.line(margin, headerY + 13.5, pageWidth - margin, headerY + 13.5);
    
    currentY = headerY + 20;
    
    // ========== STUDENT INFORMATION BOX (Light Blue with Dark Blue Border) ==========
    const profileBoxY = currentY;
    const profileBoxHeight = 32;
    const profileBoxWidth = pageWidth - (margin * 2);
    const boxPadding = 10;
    
    // Draw light blue rounded rectangle box with dark blue border
    doc.setFillColor(240, 248, 255); // Light blue background
    doc.setDrawColor(9, 62, 150); // Dark blue border
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, profileBoxY, profileBoxWidth, profileBoxHeight, 2, 2, 'FD');
    
    // Profile information in two columns
    const leftColX = margin + boxPadding;
    const rightColX = margin + (profileBoxWidth / 2) + boxPadding;
    let profileY = profileBoxY + 7;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(9, 62, 150); // Dark blue for labels
    
    // Left column
    doc.text('Student Name:', leftColX, profileY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(9, 62, 150); // Dark blue for values
    const fullNameLines = doc.splitTextToSize(profile.fullName || '-', 70);
    doc.text(fullNameLines, leftColX + 32, profileY);
    profileY += Math.max(4, fullNameLines.length * 4);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Student ID:', leftColX, profileY);
    doc.setFont('helvetica', 'normal');
    doc.text(profile.studentId || '-', leftColX + 32, profileY);
    profileY += 4;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Academic Program:', leftColX, profileY);
    doc.setFont('helvetica', 'normal');
    const programLines = doc.splitTextToSize(profile.academicProgram || '-', 70);
    doc.text(programLines, leftColX + 45, profileY);
    profileY += Math.max(4, programLines.length * 4);
    
    doc.setFont('helvetica', 'bold');
    doc.text('CGPA:', leftColX, profileY);
    doc.setFont('helvetica', 'normal');
    doc.text(studentGradeReport.cgpa.toFixed(2), leftColX + 20, profileY);
    
    // Right column
    profileY = profileBoxY + 7;
    doc.setFont('helvetica', 'bold');
    
    // Get first academic term for display (if available)
    const firstTerm = studentGradeReport.academicTerms && studentGradeReport.academicTerms.length > 0
      ? studentGradeReport.academicTerms[0]
      : null;
    
    doc.text('Batch Code:', rightColX, profileY);
    doc.setFont('helvetica', 'normal');
    doc.text(profile.batchCode || '-', rightColX + 32, profileY);
    profileY += 4;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Entry Year:', rightColX, profileY);
    doc.setFont('helvetica', 'normal');
    doc.text(profile.entryYear?.toString() || '-', rightColX + 32, profileY);
    profileY += 4;
    
    if (firstTerm) {
      doc.setFont('helvetica', 'bold');
      doc.text('Academic Term:', rightColX, profileY);
      doc.setFont('helvetica', 'normal');
      doc.text(`${firstTerm.academicTermName} - ${firstTerm.year}`, rightColX + 38, profileY);
      profileY += 4;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.text('Nationality:', rightColX, profileY);
    doc.setFont('helvetica', 'normal');
    doc.text(profile.nationality || '-', rightColX + 32, profileY);
    
    currentY = profileBoxY + profileBoxHeight + 15;

    // Draw each academic term as a card with blue left border
    studentGradeReport.academicTerms.forEach((term, termIndex) => {
      // Check if we need a new page
      if (currentY > pageHeight - 100) {
        doc.addPage();
        currentY = margin;
      }

      const cardTopY = currentY;
      const cardPadding = 10;
      const headerHeight = 15;
      const tableStartY = cardTopY + cardPadding + headerHeight + 5;

      // Calculate table height
      const courseCount = term.courses ? term.courses.length : 0;
      const rowHeight = 8;
      const tableHeaderHeight = 10;
      const footerHeight = 16; // Total and GPA rows
      const estimatedTableHeight = tableHeaderHeight + (courseCount * rowHeight) + footerHeight;
      
      const cardHeight = headerHeight + estimatedTableHeight + (cardPadding * 2) + 10;

      // Draw white card background
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.rect(cardLeftMargin, cardTopY, cardWidth, cardHeight, 'FD');

      // Draw blue left border (4px = ~1.4mm)
      doc.setFillColor(24, 144, 255); // Blue color #1890ff
      doc.rect(cardLeftMargin, cardTopY, 1.4, cardHeight, 'F');

      // Draw term header
      currentY = cardTopY + cardPadding;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(
        `${term.academicTermName} - ${term.year}`,
        cardLeftMargin + cardPadding + 1.4,
        currentY + 5
      );
      currentY = tableStartY;

      // Build table data
      const tableData: any[] = [];
      if (term.courses && term.courses.length > 0) {
        term.courses.forEach((course) => {
          tableData.push([
            course.courseCode + ' - ' + course.courseTitle,
            course.creditHours.toString(),
            course.grade,
            (course.points || 0).toString()
          ]);
        });
      }

      // Calculate totals
      const totalCreditHours = term.courses ? term.courses.reduce((sum, c) => sum + c.creditHours, 0) : 0;
      const totalPoints = term.courses ? term.courses.reduce((sum, c) => sum + (c.points || 0), 0) : 0;
      const termGPA = term.termGPA !== null && term.termGPA !== undefined ? term.termGPA.toFixed(2) : '0.00';

      // Draw table with autoTable
      autoTable(doc, {
        startY: currentY,
        margin: { left: cardLeftMargin + cardPadding + 1.4, right: margin, top: 2, bottom: 2 }, // Minimized margins
        head: [['Course Title', 'Credit Hours', 'Grade', 'Points']],
        body: tableData,
        foot: [
          ['Total', totalCreditHours.toString(), '', totalPoints.toString()],
          ['GPA', '', '', termGPA]
        ],
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: { top: 2, right: 3, bottom: 2, left: 3 }, // Minimized padding
          textColor: [0, 0, 0],
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
          minCellHeight: 7 // Minimize row height
        },
        headStyles: {
          fillColor: [250, 250, 250],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          fontSize: 9,
          cellPadding: { top: 2, right: 3, bottom: 2, left: 3 }, // Minimized padding
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
          minCellHeight: 8 // Minimize row height
        },
        footStyles: {
          fillColor: [245, 245, 245], // Light grey background for summary rows
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          fontSize: 9,
          cellPadding: { top: 2, right: 3, bottom: 2, left: 3 }, // Minimized vertical padding
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
          minCellHeight: 8 // Minimize row height
        },
        columnStyles: {
          0: { halign: 'left', cellWidth: 'auto' }, // Course Title
          1: { halign: 'center', cellWidth: 35 }, // Credit Hours
          2: { halign: 'center', cellWidth: 30 }, // Grade
          3: { halign: 'center', cellWidth: 30 } // Points - Center aligned
        },
        didParseCell: function (data) {
          // Minimize footer cell padding and height
          if (data.section === 'foot') {
            // Minimize vertical padding to reduce row height
            data.cell.styles.cellPadding = { top: 2, right: 3, bottom: 2, left: 3 };
            data.cell.styles.minCellHeight = 8;
            
            // Center align footer values in Credit Hours, Grade, and Points columns
            if (data.column.index === 1 || data.column.index === 3) {
              // Credit Hours and Points columns - center align
              data.cell.styles.halign = 'center';
            }
          }
        }
      });

      // Get the final Y position after the table
      const finalY = (doc as any).lastAutoTable.finalY || currentY;
      currentY = finalY + 15; // Add spacing between cards
    });

    // Add page numbers
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Page ${i} of ${totalPages}`,
        pageWidth - 20,
        pageHeight - 10,
        { align: 'right' }
      );
    }

    doc.save(`${fileName}_${new Date().getTime()}.pdf`);
  }
}