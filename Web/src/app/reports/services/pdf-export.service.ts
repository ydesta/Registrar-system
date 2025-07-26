// Updated PDF Export Service with working page numbers
import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable, { RowInput } from 'jspdf-autotable';
import { StudentRegistrationSlipViewModel } from 'src/app/students/models/student-profile-view-model.model';
import { StudentTranscriptViewModel } from '../model/student-transcript-view-model.model';

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
    const slipHeight = 95; 

    slips.forEach((slip, studentIndex) => {
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
      // New page for next student, unless last
      if (studentIndex < slips.length - 1) doc.addPage();
    });

    doc.save('registration-slips.pdf');
  }

  exportTranscript(transcript: StudentTranscriptViewModel, fileName: string): void {
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    this.drawWatermark(doc);
    let cursorY = this.drawHeader(doc, transcript);

    cursorY += 10;
    this.drawMediumOfInstruction(doc, cursorY);
    this.drawAcademicTermsTwoColumns(doc, transcript.academicTerms, cursorY + 15); 
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
    const y = 40;
    doc.setFont('helvetica', 'bold').setFontSize(18); 
    doc.setTextColor(0, 0, 0); 
    doc.text('HiLCoE', 20, y - 8);
    
    doc.setFontSize(11); 
    doc.setFont('helvetica', 'bold'); 
    doc.setTextColor(0, 0, 0); 
    doc.text('School of Computer Science & Technology', 20, y + 6); 
    
    doc.setFontSize(8); 
    doc.setFont('helvetica', 'bold'); 
    doc.setTextColor(0, 0, 0); 
    doc.text('Tel. (+251-111) 559769, 564900', 20, y + 18); 
    doc.text('P.O.Box 25304/1000', 20, y + 26); 
    doc.text('e-mail: info@hilcoe.net', 20, y + 34); 
    
    // Right side - Student information (if transcript is provided)
    if (transcript) {
      const rightX = 450; 
      let studentY = y - 8; 
      
      // Student name (larger, more prominent)
      // doc.setFont('helvetica', 'bold').setFontSize(10);
      // doc.setTextColor(0, 0, 0); // Changed to black color
      // doc.text(transcript.fullName, rightX, studentY);
      
      // Student details in smaller text
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold'); 
      doc.setTextColor(0, 0, 0); 
      studentY += 12;
      
      const dob = transcript.dateOfBirth
        ? new Date(transcript.dateOfBirth).toLocaleDateString()
        : 'January 15, 1983';
      
      const award = transcript.awardDate
        ? new Date(transcript.awardDate).toLocaleDateString()
        : 'August 15, 2015';
      
      // Personal Information (Right side)
      doc.text(`Full Name: ${transcript.fullName}`, rightX, studentY);
      studentY += 8;
      doc.text(`Gender: ${transcript.gender || 'Male'}`, rightX, studentY);
      studentY += 8;
      doc.text(`Date of Birth: ${dob}`, rightX, studentY);
      studentY += 8;
      doc.text(`Place of Birth: ${transcript.placeOfBirth || 'Wukro'}`, rightX, studentY);
      studentY += 8;
      doc.text(`Admission Date: ${transcript.admissionDate || 'September 2012'}`, rightX, studentY);
      
      
      const leftEndX = 200; 
      const rightStartX = 450; 
      const centerX = (leftEndX + rightStartX) / 2 - 40; 
      studentY = y + 2; 
      
      doc.text(`Programme: ${transcript.programme || 'BSc degree in Computer Science'}`, centerX, studentY);
      studentY += 8;
      doc.text(`Division: ${transcript.division || 'Day'}`, centerX, studentY);
      studentY += 8;
      doc.text(`Status: ${transcript.status || 'Regular'}`, centerX, studentY);
      studentY += 8;
      doc.text(`Major: ${transcript.major || 'Computer Science'}`, centerX, studentY);
      studentY += 8;
      doc.text(`Award Date: ${award}`, centerX, studentY);
    }
    
    return y + 60;
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
  // ACADEMIC TERMS: TWO TABLES PER ROW
  // ─────────────────────────────────────────────────────────────────────────────
  private drawAcademicTermsTwoColumns(
    doc: jsPDF,
    terms: any[] = [],
    startY: number
  ): void {
    const leftX = 20;
    const rightX = 320; // Increased gap between tables
    const columnWidth = 240; // Reduced width to accommodate spacing
    let currentY = startY + 10; // Reduced from 20 to 10 points top margin

    // Process terms in pairs (2 per row)
    for (let i = 0; i < terms.length; i += 2) {
      const term1 = terms[i];
      const term2 = terms[i + 1];
      
      // Calculate the height needed for both tables
      let maxHeight = 0;

      // Left table (Term 1)
      if (term1) {
        const height1 = this.calculateTableHeight(term1);
        maxHeight = Math.max(maxHeight, height1);
      }

      // Right table (Term 2)
      if (term2) {
        const height2 = this.calculateTableHeight(term2);
        maxHeight = Math.max(maxHeight, height2);
      }

      // Check if we need a new page based on available space
      const pageHeight = doc.internal.pageSize.height;
      const availableSpace = pageHeight - currentY - 100; // 100 points for footer and margins
      
      if (currentY > 60 && maxHeight > availableSpace) {
        doc.addPage();
        currentY = 60;
        
        // Reset styling context after page break
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(0, 0, 0);
      }

      // Draw left table (Term 1)
      if (term1) {
        this.drawSingleTermTable(doc, term1, leftX, currentY, columnWidth);
      }

      // Draw right table (Term 2)
      if (term2) {
        this.drawSingleTermTable(doc, term2, rightX, currentY, columnWidth);
      }

      // Move to next row with increased spacing
      currentY += maxHeight + 70; // Increased spacing between rows from 60 to 70
    }
  }

  private calculateTableHeight(term: any): number {
    // Estimate height based on number of courses + header + footer
    const courseCount = term.courses ? term.courses.length : 0;
    const headerHeight = 20; // Term header
    const tableHeaderHeight = 15; // Table header row
    const courseRowHeight = 12; // Each course row
    const footerHeight = 35; // Summary footer (5 rows × 7 points each)
    const spacing = 10; // Additional spacing
    
    return headerHeight + tableHeaderHeight + (courseRowHeight * courseCount) + footerHeight + spacing;
  }

  private drawSingleTermTable(
    doc: jsPDF,
    term: any,
    x: number,
    y: number,
    columnWidth: number
  ): void {
    // Styled term header with background
    const headerWidth = columnWidth + 40; // Increased from 30 to 40 for better coverage
    const headerHeight = 20; // Increased height for better appearance
    
    // Explicitly set all styling properties to ensure consistency
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.setDrawColor(0, 0, 0);
        
    // Draw header background
    doc.setFillColor(240, 240, 240); // Changed to match table header color
    doc.rect(x - 9, y - 8, headerWidth, headerHeight, 'F'); // Slightly increased positioning from -8 to -9
    
    // Draw header text
    doc.setFont('helvetica', 'bold').setFontSize(11);
    doc.setTextColor(0, 0, 0); // Changed to black text to match table header
    doc.text(`Term: ${term.termName}`, x, y + 2); // Adjusted text positioning

    // Build table data
    const body = term.courses.map((c: any) => [
      c.courseCode,
      c.courseTitle,
      String(c.creditHours),
      c.grade,
      c.gradePoint.toFixed(2),
    ]);

    // Add summary rows to the table footer
    const foot = [
      ['', 'Total:', term.totalCreditHours.toString(), '', ''],
      ['', 'Average:', term.termGPA.toFixed(2), '', ''],
      ['', 'Total Credit Hour:', term.totalCreditHours.toFixed(2), '', ''],
      ['', 'CGPA:', term.cumulativeGPA.toFixed(2), '', ''],
      ['', 'Major CGPA:', term.cumulativeMajorGPA.toFixed(2), '', '']
    ];

    // Draw the table with explicit styling
          autoTable(doc, {
            head: [['Course Code', 'Course Title', 'Credit Hour', 'Grade', 'Grade Point']],
      body,
      foot,
      startY: y + 15, // Adjusted to account for larger header
      margin: { left: x, right: doc.internal.pageSize.width - x - columnWidth },
            theme: 'grid',
      styles: { 
        fontSize: 8, 
        cellPadding: 2,
        font: 'helvetica',
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.1
      },
            headStyles: { 
              fillColor: [240, 240, 240], 
              textColor: [0, 0, 0],
        fontStyle: 'bold', 
        fontSize: 8,
        font: 'helvetica',
        lineColor: [0, 0, 0],
        lineWidth: 0.1
      },
      footStyles: { 
        fillColor: [245, 245, 245], 
        textColor: [0, 0, 0], 
        fontStyle: 'bold',
        fontSize: 8,
        font: 'helvetica',
        lineColor: [0, 0, 0],
        lineWidth: 0.1
            },
            columnStyles: {
        0: { cellWidth: 50, halign: 'left' }, // Increased from 45 to 50
        1: { cellWidth: columnWidth - (50 + 30 + 30), halign: 'left' }, // Adjusted for new widths
        2: { cellWidth: 30, halign: 'center' }, // Increased from 25 to 30
        3: { cellWidth: 30, halign: 'center' }, // Increased from 25 to 30
        4: { cellWidth: 30, halign: 'center' }, // Increased from 25 to 30
      },
      didDrawPage: (data) => {
        // Add page number at the bottom center of each page
        const pageCount = doc.getNumberOfPages();
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
          
          doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Page ${pageCount}`, pageWidth / 2, pageHeight - 20, { align: 'center' });
      },
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
    // Use existing page 2 instead of creating new page
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // Add signature section at bottom of page 2
    const signatureY = pageHeight - 120;
    
    // Left signature - Chief Registrar
    const leftX = 80;
    
    // Signature line (above name)
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(leftX - 20, signatureY, leftX + 80, signatureY);
    
    // Name and title (below signature line)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Mohammed Juhar', leftX, signatureY + 15);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Chief Registrar', leftX, signatureY + 30);
    
    // Right signature - Academic Programme Coordinator
    const rightX = pageWidth - 200;
    
    // Signature line (above name)
    doc.line(rightX - 20, signatureY, rightX + 120, signatureY);
    
    // Name and title (below signature line)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Abdella Endris', rightX, signatureY + 15);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Academic Programme Coordinator', rightX, signatureY + 30);
    
    // Add date
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${currentDate}`, pageWidth / 2, signatureY + 50, { align: 'center' });
  }
}