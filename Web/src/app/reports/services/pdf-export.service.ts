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
    const slipHeight = 85; // Reduced from 95 to 85

    slips.forEach((slip, studentIndex) => {
      for (let copy = 0; copy < 3; copy++) {
        const yOffset = 8 + copy * slipHeight; // Reduced from 10 to 8
        doc.setFontSize(10); // Reduced from 12 to 10
        doc.setTextColor(9, 62, 150);
        doc.text(`HiLCoE Registration ${slip.academicTerm}/Offer Batch ${slip.offeredBatchCode}`, 105, yOffset + 3, { align: 'center' }); // Reduced from 4 to 3
        doc.setDrawColor(9, 62, 150);
        doc.setLineWidth(0.5); // Reduced from 0.7 to 0.5
        doc.line(20, yOffset + 6, 190, yOffset + 6); // Reduced from 7 to 6

        doc.setDrawColor(41, 128, 185);
        doc.setFillColor(240, 248, 255);
        doc.roundedRect(25, yOffset + 8, 160, 24, 2, 2, 'FD'); // Reduced height from 28 to 24
        doc.setFontSize(7); // Reduced from 8 to 7
        doc.setFont('helvetica', 'bold');
        doc.text('Student Name:', 30, yOffset + 13); // Reduced from 16 to 13
        doc.text('Student ID:', 30, yOffset + 17); // Reduced from 21 to 17
        doc.text('Academic Term:', 110, yOffset + 13); // Reduced from 16 to 13
        doc.text('Own Batch:', 110, yOffset + 17); // Reduced from 21 to 17
        doc.setFont('helvetica', 'normal');
        doc.text(slip.fullName, 60, yOffset + 13); // Reduced from 16 to 13
        doc.text(slip.studentCode, 60, yOffset + 17); // Reduced from 21 to 17
        doc.text(slip.academicTerm, 145, yOffset + 13); // Reduced from 16 to 13
        doc.text(slip.owenBatchCode, 145, yOffset + 17); // Reduced from 21 to 17

        // Info box two-column layout for extra fields
        // First row (left)
        doc.setFont('helvetica', 'bold');
        doc.text('Bank:', 30, yOffset + 21); // Reduced from 26 to 21
        doc.setFont('helvetica', 'normal');
        doc.text(`From: ${slip.fromBank} To: ${slip.toBank}`, 60, yOffset + 21); // Reduced from 26 to 21

        doc.setFont('helvetica', 'bold');
        doc.text('FS NO.:', 30, yOffset + 25); // Reduced from 31 to 25
        doc.setFont('helvetica', 'normal');
        doc.text('____________________', 60, yOffset + 25); // Reduced from 31 to 25

        // First row (right)
        doc.setFont('helvetica', 'bold');
        doc.text('Bank Transaction Id .:', 110, yOffset + 21); // Reduced from 26 to 21
        doc.setFont('helvetica', 'normal');
        doc.text(slip.bankTransactionId, 145, yOffset + 21); // Reduced from 26 to 21

        doc.setFont('helvetica', 'bold');
        doc.text('Registration Date:', 110, yOffset + 25); // Reduced from 31 to 25
        doc.setFont('helvetica', 'normal');
        doc.text(slip.registrationDate, 145, yOffset + 25); // Reduced from 31 to 25

        // Table (move up to follow the info box, now below the larger card)
        autoTable(doc, {
          startY: yOffset + 32, // Reduced from 40 to 32
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
          headStyles: { fillColor: [9, 62, 150], textColor: 255, fontSize: 6 }, // Reduced from 8 to 6
          footStyles: { fillColor: [245, 245, 245], textColor: 0, fontStyle: 'bold', fontSize: 6 }, // Reduced from 8 to 6
          styles: { fontSize: 6, cellPadding: 1 }, // Reduced from 8 to 6, and padding from 1.5 to 1
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
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
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
    const y = 30; // Reduced from 40 to 30
    
    // Draw header background rectangle
    doc.setFillColor(240, 240, 240); // Light gray background to match table header
    doc.rect(15, y - 15, 580, 110, 'F'); // Increased height from 100 to 110 to accommodate medium of instruction
    
    // Institution name with enhanced styling
    doc.setFont('helvetica', 'bold').setFontSize(22); 
    doc.setTextColor(0, 0, 0); // Black text for contrast
    doc.text('HiLCoE', 20, y - 8);
    
    doc.setFontSize(12); 
    doc.setFont('helvetica', 'bold'); 
    doc.setTextColor(0, 0, 0); // Black text for contrast
    doc.text('School of Computer Science & Technology', 20, y + 8); 
    
    // Contact information with subtle styling
    doc.setFontSize(8); 
    doc.setFont('helvetica', 'normal'); 
    doc.setTextColor(80, 80, 80); // Dark gray text
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
      const rightX = 450; 
      let studentY = y - 8; 
      
      // Student details with enhanced styling
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold'); 
      doc.setTextColor(0, 0, 0); // Black text for contrast
      studentY += 12;
      
      const dob = transcript.dateOfBirth
        ? new Date(transcript.dateOfBirth).toLocaleDateString()
        : 'January 15, 1983';
      
      const award = transcript.awardDate
        ? new Date(transcript.awardDate).toLocaleDateString()
        : 'August 15, 2015';
      
      // Personal Information (Right side)
      doc.text(`Full Name: ${transcript.fullName}`, rightX, studentY);
      studentY += 14; // Increased from 12 to 14
      doc.text(`Gender: ${transcript.gender || 'Male'}`, rightX, studentY);
      studentY += 14; // Increased from 12 to 14
      doc.text(`Date of Birth: ${dob}`, rightX, studentY);
      studentY += 14; // Increased from 12 to 14
      doc.text(`Place of Birth: ${transcript.placeOfBirth || 'Wukro'}`, rightX, studentY);
      studentY += 14; // Increased from 12 to 14
      // Format admission date to date-month-year format
      let admissionDateFormatted = 'September 2012'; // Default
      if (transcript.admissionDate) {
        try {
          const date = new Date(transcript.admissionDate);
          const day = date.getDate();
          const month = date.toLocaleDateString('en-US', { month: 'long' });
          const year = date.getFullYear();
          admissionDateFormatted = `${day}-${month}-${year}`;
        } catch (error) {
          admissionDateFormatted = 'September 2012'; // Fallback
        }
      }
      doc.text(`Admission Date: ${admissionDateFormatted}`, rightX, studentY);
      
      
      const leftEndX = 200; 
      const rightStartX = 450; 
      const centerX = (leftEndX + rightStartX) / 2 - 40; 
      studentY = y + 2; 
      
      // Center section with enhanced styling and text wrapping
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold'); 
      doc.setTextColor(0, 0, 0); // Black text for contrast
      
      // Programme with text wrapping
      const programmeText = `Programme: ${transcript.programme || 'BSc degree in Computer Science'}`;
      const maxWidth = 120; // Maximum width for text wrapping
      const programmeLines = doc.splitTextToSize(programmeText, maxWidth);
      programmeLines.forEach((line: string, index: number) => {
        doc.text(line, centerX, studentY + (index * 10));
      });
      studentY += (programmeLines.length * 10) + 4; // Dynamic spacing based on wrapped lines
      
      doc.text(`Division: ${transcript.division || 'Day'}`, centerX, studentY);
      studentY += 14; // Increased from 12 to 14
      doc.text(`Status: ${transcript.status || 'Regular'}`, centerX, studentY);
      studentY += 14; // Increased from 12 to 14
      doc.text(`Major: ${transcript.major || 'Computer Science'}`, centerX, studentY);
      studentY += 14; // Increased from 12 to 14
      doc.text(`Award Date: ${award}`, centerX, studentY);
    }
    
    return y + 105; // Increased from 95 to 105 to accommodate larger header background with medium of instruction
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
    startY: number,
    transcript?: StudentTranscriptViewModel
  ): void {
    const leftX = 20;
    const rightX = 320; // Increased gap between tables
    const columnWidth = 240; // Reduced width to accommodate spacing
    let currentY = startY + 5; // Reduced from 10 to 5 points top margin

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
        
        // Draw header on new page
        this.drawHeader(doc, transcript);
        
        currentY = 140; // Increased from 120 to 140 to add more space after header
        
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

      // Move to next row with reduced spacing
      currentY += maxHeight + 40; // Reduced spacing between rows from 70 to 40
    }
  }

  private calculateTableHeight(term: any): number {
    // Estimate height based on number of courses + header + footer
    const courseCount = term.courses ? term.courses.length : 0;
    const headerHeight = 15; // Reduced term header height from 20 to 15
    const tableHeaderHeight = 12; // Reduced table header height from 15 to 12
    const courseRowHeight = 10; // Reduced course row height from 12 to 10
    const footerHeight = 30; // Reduced footer height from 35 to 30
    const spacing = 5; // Reduced spacing from 10 to 5
    
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
    const headerHeight = 15; // Reduced height from 20 to 15
    
    // Explicitly set all styling properties to ensure consistency
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.setDrawColor(0, 0, 0);
        
    // Draw header background
    doc.setFillColor(240, 240, 240); // Changed to match table header color
    doc.rect(x - 9, y - 8, headerWidth, headerHeight, 'F'); // Slightly increased positioning from -8 to -9
    
    // Draw header text centered
    doc.setFont('helvetica', 'bold').setFontSize(11);
    doc.setTextColor(0, 0, 0); // Changed to black text to match table header
    const termText = `Term: ${term.termName}`;
    const termTextWidth = doc.getTextWidth(termText);
    const centerX = x + (headerWidth / 2) - (termTextWidth / 2);
    doc.text(termText, centerX, y + 2); // Centered text positioning

    // Add horizontal line below header
    doc.setDrawColor(200, 200, 200); // Light gray line
    doc.setLineWidth(0.5);
    doc.line(x - 9, y + headerHeight - 2, x + headerWidth - 9, y + headerHeight - 2);

    // Build table data
    const body = term.courses.map((c: any) => [
      c.courseCode,
      c.courseTitle,
      String(c.creditHours),
      c.grade,
      c.gradePoint.toFixed(2),
    ]);

    // Add summary rows to the table footer with proper alignment
    const foot = [
      ['', 'Total:', term.totalCreditHours.toString(), '', ''],
      ['', 'Average:', term.termGPA.toFixed(2), '', ''],
      ['', 'Total Credit Hour:', term.totalCreditHours.toFixed(2), '', ''],
      ['', 'CGPA:', term.cumulativeGPA.toFixed(2), '', ''],
      ['', 'Major CGPA:', term.cumulativeMajorGPA.toFixed(2), '']
    ];

    // Draw the table with explicit styling
          autoTable(doc, {
            head: [['Course Code', 'Course Title', 'Credit Hour', 'Grade', 'Grade Point']],
      body,
      foot,
      startY: y + 12, // Reduced from 15 to 12 to account for smaller header
      margin: { left: x, right: doc.internal.pageSize.width - x - columnWidth },
            theme: 'grid',
      styles: { 
        fontSize: 7, // Reduced from 8 to 7
        cellPadding: 1, // Reduced from 2 to 1
        font: 'helvetica',
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.1
      },
            headStyles: { 
              fillColor: [240, 240, 240], 
              textColor: [0, 0, 0],
        fontStyle: 'bold', 
        fontSize: 7, // Reduced from 8 to 7
        font: 'helvetica',
        lineColor: [0, 0, 0],
        lineWidth: 0.1
      },
      footStyles: { 
        fillColor: [245, 245, 245], 
        textColor: [0, 0, 0], 
        fontStyle: 'bold',
        fontSize: 7, // Reduced from 8 to 7
        font: 'helvetica',
        lineColor: [255, 255, 255], // Changed to white to hide borders
        lineWidth: 0
            },
            columnStyles: {
        0: { cellWidth: 50, halign: 'left' }, // Course Code
        1: { cellWidth: columnWidth - (50 + 30 + 30), halign: 'left' }, // Course Title
        2: { cellWidth: 30, halign: 'center' }, // Credit Hour
        3: { cellWidth: 30, halign: 'center' }, // Grade
        4: { cellWidth: 30, halign: 'center' }, // Grade Point
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
      didParseCell: function (data) {
        // Right-align only footer labels (column 1 in footer section)
        if (data.section === 'foot' && data.column.index === 1) {
          data.cell.styles.halign = 'right';
        }
        // Center-align footer values (column 2 in footer section - Credit Hour column)
        if (data.section === 'foot' && data.column.index === 2) {
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