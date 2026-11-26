import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import * as ExcelJS from 'exceljs';
import {
  StudentTranscriptViewModel,
  TranscriptTermViewModel,
  TranscriptCourseViewModel
} from '../model/student-transcript-view-model.model';

@Injectable({
  providedIn: 'root'
})
export class ExcelExportService {
  private readonly TABLES_PER_PAGE = 6;
  private readonly COLS_PER_TABLE = 5;
  private readonly LEFT_START = 1;   // A
  private readonly RIGHT_START = 7;  // G
  private readonly HEADER_ROWS = 6;
  private readonly SUMMARY_ROWS = 5;
  private readonly GREY_FILL: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF0F0F0' }
  };
  private readonly THIN_BORDER: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FF000000' } },
    left: { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FF000000' } }
  };

  exportAsExcelFile<T>(
    data: T[],
    fileName: string,
    sheetName = 'Sheet1',
    headers?: string[]
  ): void {
    if (!data?.length) {
      console.warn('No data to export');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    this.addHeaders(worksheet, headers);
    this.saveWorkbook(worksheet, fileName, sheetName);
  }

  exportWithCustomLayout(
    data: any[][],
    fileName: string,
    sheetName = 'Sheet1',
    merges?: XLSX.Range[]
  ): void {
    if (!data?.length) {
      console.warn('No data to export');
      return;
    }

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    if (merges) {
      worksheet['!merges'] = merges;
    }
    this.saveWorkbook(worksheet, fileName, sheetName);
  }

  private addHeaders(worksheet: XLSX.WorkSheet, headers?: string[]): void {
    if (headers) {
      XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: 'A1' });
    }
  }

  private saveWorkbook(worksheet: XLSX.WorkSheet, fileName: string, sheetName: string): void {
    const workbook: XLSX.WorkBook = {
      Sheets: { [sheetName]: worksheet },
      SheetNames: [sheetName]
    };

    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    });

    this.saveAsExcelFile(excelBuffer, fileName);
  }

  private saveAsExcelFile(buffer: BlobPart, fileName: string): void {
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    saveAs(blob, `${fileName}_${new Date().getTime()}.xlsx`);
  }

  /**
   * Official transcript layout: two-column header + up to 6 term tables per page (2×3 grid).
   */
  async exportTranscript(transcript: StudentTranscriptViewModel, fileName: string): Promise<void> {
    if (!transcript) {
      console.warn('No transcript to export');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'HiLCoE Registrar';
    const worksheet = workbook.addWorksheet('Transcript', {
      pageSetup: {
        paperSize: 1, // Letter
        orientation: 'portrait',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        horizontalCentered: true,
        margins: {
          left: 0.4,
          right: 0.4,
          top: 0.5,
          bottom: 0.5,
          header: 0.2,
          footer: 0.2
        }
      },
      views: [{ showGridLines: false }]
    });

    this.setColumnWidths(worksheet);

    const terms = transcript.academicTerms || [];
    let currentRow = 1;

    if (terms.length === 0) {
      this.drawStudentHeader(worksheet, transcript, currentRow);
      currentRow += this.HEADER_ROWS + 1;
    } else {
      for (let pageStart = 0; pageStart < terms.length; pageStart += this.TABLES_PER_PAGE) {
        if (pageStart > 0) {
          worksheet.getRow(currentRow - 1).addPageBreak();
        }

        this.drawStudentHeader(worksheet, transcript, currentRow);
        currentRow += this.HEADER_ROWS + 1; // header + spacer

        const pageTerms = terms.slice(pageStart, pageStart + this.TABLES_PER_PAGE);
        currentRow = this.drawTermGrid(worksheet, pageTerms, currentRow);
        currentRow += 1;
      }
    }

    // Two blank rows, then signature blocks under left/right columns
    this.drawSignatureFooter(worksheet, currentRow + 1);

    const buffer = await workbook.xlsx.writeBuffer();
    this.saveAsExcelFile(buffer, fileName);
  }

  private drawSignatureFooter(ws: ExcelJS.Worksheet, startRow: number): void {
    const lineRow = startRow;
    const nameRow = startRow + 1;
    const titleRow = startRow + 2;

    this.drawSignatureBlock(
      ws,
      this.LEFT_START,
      this.LEFT_START + this.COLS_PER_TABLE - 1,
      lineRow,
      nameRow,
      titleRow,
      'Mohammed Juhar',
      'Chief Registrar'
    );

    this.drawSignatureBlock(
      ws,
      this.RIGHT_START,
      this.RIGHT_START + this.COLS_PER_TABLE - 1,
      lineRow,
      nameRow,
      titleRow,
      'Abdella Endris',
      'Academic Programme Coordinator'
    );
  }

  private drawSignatureBlock(
    ws: ExcelJS.Worksheet,
    fromCol: number,
    toCol: number,
    lineRow: number,
    nameRow: number,
    titleRow: number,
    name: string,
    title: string
  ): void {
    // Short centered signature line (middle 3 columns of the 5-col block)
    const lineFrom = fromCol + 1;
    const lineTo = toCol - 1;
    ws.mergeCells(lineRow, lineFrom, lineRow, lineTo);
    const lineCell = ws.getCell(lineRow, lineFrom);
    lineCell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } }
    };

    ws.mergeCells(nameRow, fromCol, nameRow, toCol);
    const nameCell = ws.getCell(nameRow, fromCol);
    nameCell.value = name;
    nameCell.font = { name: 'Calibri', size: 11 };
    nameCell.alignment = { horizontal: 'center', vertical: 'middle' };

    ws.mergeCells(titleRow, fromCol, titleRow, toCol);
    const titleCell = ws.getCell(titleRow, fromCol);
    titleCell.value = title;
    titleCell.font = { name: 'Calibri', size: 11 };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  }

  private setColumnWidths(ws: ExcelJS.Worksheet): void {
    // Left table A–E | spacer F | Right table G–K
    const widths = [
      12, // A Course Code
      28, // B Course Title
      11, // C Credit Hour
      8,  // D Grade
      11, // E Grade Point
      3,  // F spacer
      12, // G Course Code
      28, // H Course Title
      11, // I Credit Hour
      8,  // J Grade
      11  // K Grade Point
    ];
    widths.forEach((w, i) => {
      ws.getColumn(i + 1).width = w;
    });
  }

  private drawStudentHeader(
    ws: ExcelJS.Worksheet,
    transcript: StudentTranscriptViewModel,
    startRow: number
  ): void {
    const programme = transcript.programme || 'BSc. degree in Computer Science';
    const division = transcript.division || 'Daytime';
    const status = transcript.status || 'Regular';
    const major = transcript.major || 'Computer Science';
    const medium = transcript.mediumOfInstruction || 'English';
    const awardDate = this.formatDate(transcript.awardDate, 'August 15, 2016');

    const fullName = transcript.fullName || '';
    const gender = transcript.gender || 'Male';
    const dob = this.formatDate(transcript.dateOfBirth, 'January 15, 1983');
    const placeOfBirth = transcript.placeOfBirth || 'Wukro';
    const admissionDate = this.formatAdmissionDate(transcript.admissionDate);

    const leftFields: Array<[string, string]> = [
      ['Programme:', programme],
      ['Division:', division],
      ['Status:', status],
      ['Major:', major],
      ['Medium of instruction:', medium],
      ['Award Date:', awardDate]
    ];

    const rightFields: Array<[string, string]> = [
      ['Full Name:', fullName],
      ['Gender:', gender],
      ['Date of Birth:', dob],
      ['Place of Birth:', placeOfBirth],
      ['Admission Date:', admissionDate]
    ];

    leftFields.forEach(([label, value], i) => {
      const row = startRow + i;
      this.writeLabeledValue(ws, row, this.LEFT_START, label, value, 5);
    });

    rightFields.forEach(([label, value], i) => {
      const row = startRow + i;
      this.writeLabeledValue(ws, row, this.RIGHT_START, label, value, 5);
    });

    // Double line under header (row startRow + 5 covers last left field)
    const borderRow = startRow + leftFields.length - 1;
    for (let col = this.LEFT_START; col <= this.RIGHT_START + this.COLS_PER_TABLE - 1; col++) {
      if (col === 6) {
        continue; // spacer
      }
      const cell = ws.getCell(borderRow, col);
      cell.border = {
        ...(cell.border || {}),
        bottom: { style: 'double', color: { argb: 'FF000000' } }
      };
    }
  }

  private writeLabeledValue(
    ws: ExcelJS.Worksheet,
    row: number,
    startCol: number,
    label: string,
    value: string,
    span: number
  ): void {
    const labelCell = ws.getCell(row, startCol);
    labelCell.value = label;
    labelCell.font = { name: 'Times New Roman', size: 10, bold: true };

    const valueCol = startCol + 1;
    const endCol = startCol + span - 1;
    if (endCol > valueCol) {
      ws.mergeCells(row, valueCol, row, endCol);
    }
    const valueCell = ws.getCell(row, valueCol);
    valueCell.value = value;
    valueCell.font = { name: 'Times New Roman', size: 10, underline: true };
  }

  private drawTermGrid(
    ws: ExcelJS.Worksheet,
    pageTerms: TranscriptTermViewModel[],
    startRow: number
  ): number {
    let row = startRow;

    for (let i = 0; i < pageTerms.length; i += 2) {
      const left = pageTerms[i];
      const right = pageTerms[i + 1];
      const maxCourses = Math.max(
        left?.courses?.length || 0,
        right?.courses?.length || 0,
        1
      );

      const blockHeight = 1 + 1 + maxCourses + this.SUMMARY_ROWS; // term title + col headers + courses + summary

      if (left) {
        this.drawTermTable(ws, left, row, this.LEFT_START, maxCourses);
      }
      if (right) {
        this.drawTermTable(ws, right, row, this.RIGHT_START, maxCourses);
      }

      row += blockHeight + 1; // one blank row between term-table pairs
    }

    return row;
  }

  private drawTermTable(
    ws: ExcelJS.Worksheet,
    term: TranscriptTermViewModel,
    startRow: number,
    startCol: number,
    targetCourseCount: number
  ): void {
    const endCol = startCol + this.COLS_PER_TABLE - 1;
    let row = startRow;

    // Term title bar — full-width grey header like the official sheet
    ws.mergeCells(row, startCol, row, endCol);
    for (let c = startCol; c <= endCol; c++) {
      const cell = ws.getCell(row, c);
      cell.fill = this.GREY_FILL;
      cell.border = this.THIN_BORDER;
    }
    const titleCell = ws.getCell(row, startCol);
    titleCell.value = `Term: ${term.termName || ''}`;
    titleCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF000000' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(row).height = 18;
    row += 1;

    // Column headers — bold, centered
    const headers = ['Course Code', 'Course Title', 'Credit Hour', 'Grade', 'Grade Point'];
    headers.forEach((header, i) => {
      const cell = ws.getCell(row, startCol + i);
      cell.value = header;
      cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF000000' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFFFF' }
      };
      cell.border = this.THIN_BORDER;
    });
    ws.getRow(row).height = 20;
    row += 1;

    // Course rows (padded for alignment with sibling table)
    const courses = term.courses || [];
    for (let i = 0; i < targetCourseCount; i++) {
      const course = courses[i];
      this.writeCourseRow(ws, row, startCol, course);
      row += 1;
    }

    // Summary footer — Total keeps course grid; other rows use merged labels
    const termCredit =
      term.termTotalCreditHours ??
      courses.reduce((sum, c) => sum + (c?.creditHours ?? 0), 0);
    const average = term.termGPA ?? term.termAverage;
    const cumulativeCredit =
      term.cumulativeCreditHours ?? term.totalCreditHours ?? termCredit;
    const cgpa = term.cumulativeGPA ?? term.cumulativeCGPA;
    const majorCgpa = term.cumulativeMajorGPA ?? term.cumulativeMajorCGPA;
    const gradePointSum = courses.reduce(
      (sum, c) => sum + (c?.gradePoint != null ? Number(c.gradePoint) : 0),
      0
    );

    this.drawTotalRow(
      ws,
      row,
      startCol,
      termCredit,
      gradePointSum ? Number(gradePointSum).toFixed(2) : ''
    );
    row += 1;

    const footerRows: Array<{ label: string; value: string | number; underline: boolean }> = [
      {
        label: 'Average',
        value: average != null ? Number(average).toFixed(2) : '',
        underline: true
      },
      {
        label: 'Total Credit Hour',
        value: cumulativeCredit != null ? Number(cumulativeCredit).toFixed(2) : '',
        underline: true
      },
      {
        label: 'CGPA',
        value: cgpa != null ? Number(cgpa).toFixed(2) : '',
        underline: true
      },
      {
        label: 'Major CGPA',
        value: majorCgpa != null ? Number(majorCgpa).toFixed(2) : '',
        underline: false
      }
    ];

    const footerStartRow = row;
    footerRows.forEach((item, index) => {
      this.drawMergedFooterRow(
        ws,
        row,
        startCol,
        item.label,
        item.value,
        item.underline,
        index === footerRows.length - 1
      );
      row += 1;
    });
    const footerEndRow = row - 1;

    // Grade + Grade Point empty merge for Average → Major CGPA only
    const gradeCol = startCol + 3;
    ws.mergeCells(footerStartRow, gradeCol, footerEndRow, endCol);
    const emptyRight = ws.getCell(footerStartRow, gradeCol);
    emptyRight.value = null;
    emptyRight.border = {
      right: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } }
    };

    // Bottom line under Major CGPA across the full term table (red indicator)
    for (let c = startCol; c <= endCol; c++) {
      const cell = ws.getCell(footerEndRow, c);
      cell.border = {
        ...(cell.border || {}),
        bottom: { style: 'thin', color: { argb: 'FF000000' } }
      };
    }
  }

  private drawTotalRow(
    ws: ExcelJS.Worksheet,
    row: number,
    startCol: number,
    creditValue: string | number,
    gradePointValue: string | number
  ): void {
    const titleCol = startCol + 1;
    const creditCol = startCol + 2;
    const gradeCol = startCol + 3;
    const gpCol = startCol + 4;

    // Merge Course Code + Course Title, right-align "Total"
    ws.mergeCells(row, startCol, row, titleCol);
    const labelCell = ws.getCell(row, startCol);
    labelCell.value = 'Total';
    labelCell.font = { name: 'Arial', size: 9, bold: true };
    labelCell.alignment = { horizontal: 'right', vertical: 'middle' };
    labelCell.border = {
      left: { style: 'thin', color: { argb: 'FF000000' } }
    };

    // Credit Hour boxed (vertical lines per red indicator)
    const creditCell = ws.getCell(row, creditCol);
    creditCell.value = creditValue;
    creditCell.font = { name: 'Arial', size: 9, bold: true };
    creditCell.alignment = { horizontal: 'right', vertical: 'middle' };
    creditCell.border = this.THIN_BORDER;

    // Empty Grade between credit and GP — no fill, no extra box
    const gradeCell = ws.getCell(row, gradeCol);
    gradeCell.value = null;
    gradeCell.border = undefined;

    // Grade Point boxed (vertical lines per red indicator)
    const gpCell = ws.getCell(row, gpCol);
    gpCell.value = gradePointValue === '' ? null : gradePointValue;
    gpCell.font = { name: 'Arial', size: 9, bold: true };
    gpCell.alignment = { horizontal: 'center', vertical: 'middle' };
    gpCell.border = this.THIN_BORDER;
  }

  private drawMergedFooterRow(
    ws: ExcelJS.Worksheet,
    row: number,
    startCol: number,
    label: string,
    value: string | number,
    underline: boolean,
    isLast: boolean
  ): void {
    const titleCol = startCol + 1;
    const creditCol = startCol + 2;

    // Merge Course Code + Course Title, right-align label
    ws.mergeCells(row, startCol, row, titleCol);
    const labelCell = ws.getCell(row, startCol);
    labelCell.value = label;
    labelCell.font = { name: 'Arial', size: 9, bold: true };
    labelCell.alignment = { horizontal: 'right', vertical: 'middle' };
    labelCell.border = {
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: isLast ? { style: 'thin', color: { argb: 'FF000000' } } : undefined
    };

    // Credit values centered with underlines
    const valueCell = ws.getCell(row, creditCol);
    valueCell.value = value === '' ? null : value;
    valueCell.font = { name: 'Arial', size: 9, bold: true };
    valueCell.alignment = { horizontal: 'right', vertical: 'middle' };
    valueCell.border = {
      bottom:
        underline || isLast
          ? { style: 'thin', color: { argb: 'FF000000' } }
          : undefined
    };
  }

  private writeCourseRow(
    ws: ExcelJS.Worksheet,
    row: number,
    startCol: number,
    course?: TranscriptCourseViewModel
  ): void {
    const values = course
      ? [
          course.courseCode || '',
          course.courseTitle || '',
          course.creditHours ?? '',
          course.grade || '',
          course.gradePoint != null ? Number(course.gradePoint).toFixed(2) : ''
        ]
      : ['', '', '', '', ''];

    values.forEach((value, i) => {
      const cell = ws.getCell(row, startCol + i);
      cell.value = value;
      cell.font = { name: 'Arial', size: 9 };
      cell.border = this.THIN_BORDER;
      // Code/Title left; Credit Hour / Grade / Grade Point centered
      cell.alignment = {
        horizontal: i === 0 || i === 1 ? 'left' : 'center',
        vertical: 'middle'
      };
    });
  }

  private applyBorderRange(
    ws: ExcelJS.Worksheet,
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number
  ): void {
    for (let r = fromRow; r <= toRow; r++) {
      for (let c = fromCol; c <= toCol; c++) {
        ws.getCell(r, c).border = this.THIN_BORDER;
      }
    }
  }

  private formatDate(value: Date | string | null | undefined, fallback: string): string {
    if (!value) {
      return fallback;
    }
    try {
      return new Date(value).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return fallback;
    }
  }

  private formatAdmissionDate(value: Date | string | null | undefined): string {
    if (!value) {
      return 'September 2012';
    }
    try {
      const date = new Date(value);
      const day = date.getDate();
      const month = date.toLocaleDateString('en-US', { month: 'long' });
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return 'September 2012';
    }
  }

  /**
   * Result Submission Sheet (mark list) matching the official HiLCoE template.
   */
  async exportResultSubmissionMarkList(options: {
    classBatch: string;
    sectionName: string;
    termLabel: string;
    courseCode: string;
    instructorName?: string;
    students: Array<{ studentCode: string; fullName: string; batchCode: string }>;
    fileName?: string;
  }): Promise<void> {
    const {
      classBatch,
      sectionName,
      termLabel,
      courseCode,
      instructorName,
      students,
      fileName
    } = options;

    if (!students?.length) {
      return;
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'HiLCoE Registrar';

    const safeSheetName = (sectionName || 'Section 1')
      .replace(/[\\/?*[\]]/g, ' ')
      .substring(0, 31);
    const ws = workbook.addWorksheet(safeSheetName || 'Section 1', {
      views: [{ showGridLines: true }]
    });

    // A–I column widths (Name is wide like the template)
    ws.columns = [
      { width: 12 },  // A S.Code
      { width: 32 },  // B Name
      { width: 14 },  // C Batch
      { width: 8 },   // D %
      { width: 8 },   // E %
      { width: 8 },   // F %
      { width: 9 },   // G 100%
      { width: 10 },  // H Grade
      { width: 14 }   // I Remark
    ];

    const boldFont: Partial<ExcelJS.Font> = { name: 'Calibri', size: 11, bold: true };
    const titleFont: Partial<ExcelJS.Font> = { name: 'Calibri', size: 16, bold: true };
    const headerFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF556B2F' } // olive green
    };
    const headerFont: Partial<ExcelJS.Font> = {
      name: 'Calibri',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFF99' } // light yellow
    };

    // Row 1 — school title centered across A–I
    ws.mergeCells(1, 1, 1, 9);
    const titleCell = ws.getCell(1, 1);
    titleCell.value = 'HiLCoE School of Computer Science & Technology';
    titleCell.font = titleFont;
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 24;

    // Row 2 — sheet subtitle
    ws.getCell(2, 2).value = 'Result Submission Sheet';
    ws.getCell(2, 2).font = { name: 'Calibri', size: 12, bold: true };

    // Rows 4–7 — metadata (Class / Section / Term / Course / Instructor + Date / Signature)
    const writeMeta = (row: number, col: number, text: string) => {
      const cell = ws.getCell(row, col);
      cell.value = text;
      cell.font = boldFont;
    };

    writeMeta(4, 2, `Class: ${classBatch || ''}`);
    writeMeta(4, 4, `Section: ${sectionName || ''}`);

    writeMeta(5, 2, `Term: ${termLabel || ''}`);
    writeMeta(5, 7, 'Date of Submission: _______________');

    writeMeta(6, 2, `Course Code: ${courseCode || ''}`);

    writeMeta(7, 2, `Instructor: ${instructorName?.trim() || ''}`);
    writeMeta(7, 7, 'Signature: _______________');

    // Row 9 — table headers
    const headers = ['S.Code', 'Name', 'Batch', '%', '%', '%', '100%', 'Grade', 'Remark'];
    const headerRow = 9;
    headers.forEach((header, i) => {
      const cell = ws.getCell(headerRow, i + 1);
      cell.value = header;
      cell.font = headerFont;
      cell.fill = headerFill;
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = this.THIN_BORDER;
    });
    ws.getRow(headerRow).height = 20;

    // Student rows
    students.forEach((student, index) => {
      const row = headerRow + 1 + index;
      const values = [
        student.studentCode || '',
        student.fullName || '',
        student.batchCode || '',
        '',
        '',
        '',
        '',
        '',
        ''
      ];
      values.forEach((value, i) => {
        const cell = ws.getCell(row, i + 1);
        cell.value = value;
        cell.font = { name: 'Calibri', size: 11 };
        cell.border = this.THIN_BORDER;
        cell.alignment = {
          horizontal: i === 1 ? 'left' : 'center',
          vertical: 'middle'
        };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const name =
      fileName ||
      `mark-list-${courseCode || 'course'}-${sectionName || 'section'}-${new Date()
        .toISOString()
        .split('T')[0]}.xlsx`;
    saveAs(blob, name.endsWith('.xlsx') ? name : `${name}.xlsx`);
  }
}
