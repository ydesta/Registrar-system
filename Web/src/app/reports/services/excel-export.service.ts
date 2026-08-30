import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

@Injectable({
  providedIn: 'root'
})
export class ExcelExportService {
  // For basic tabular data exports
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

  // For complex layouts with merged cells
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

  exportTranscript(transcript: any, fileName: string): void {
    if (!transcript) {
      console.warn('No transcript to export');
      return;
    }

    const rows: any[][] = [];
    rows.push(['HiLCoE School of Computer Science & Technology']);
    rows.push(['Student Transcript']);
    rows.push([]);
    rows.push(['Full Name', transcript.fullName || '']);
    rows.push(['Gender', transcript.gender || '']);
    rows.push(['Date of Birth', transcript.dateOfBirth ? new Date(transcript.dateOfBirth).toLocaleDateString() : '']);
    rows.push(['Place of Birth', transcript.placeOfBirth || '']);
    rows.push(['Admission Date', transcript.admissionDate ? new Date(transcript.admissionDate).toLocaleDateString() : '']);
    rows.push(['Programme', transcript.programme || '']);
    rows.push(['Division', transcript.division || '']);
    rows.push(['Status', transcript.status || '']);
    rows.push(['Major', transcript.major || '']);
    rows.push([
      'Award Date',
      transcript.awardDate ? new Date(transcript.awardDate).toLocaleDateString() : ''
    ]);
    rows.push([]);

    const terms = transcript.academicTerms || [];
    for (const term of terms) {
      rows.push([`Term: ${term.termName || ''}`]);
      rows.push(['Course Code', 'Course Title', 'Credit Hour', 'Grade', 'Grade Point']);

      for (const course of term.courses || []) {
        rows.push([
          course.courseCode || '',
          course.courseTitle || '',
          course.creditHours ?? '',
          course.grade || '',
          course.gradePoint != null ? Number(course.gradePoint).toFixed(2) : ''
        ]);
      }

      rows.push(['', 'Total:', term.totalCreditHours ?? '', '', '']);
      rows.push(['', 'Average:', term.termGPA != null ? Number(term.termGPA).toFixed(2) : '', '', '']);
      rows.push([
        '',
        'Total Credit Hour:',
        term.totalCreditHours != null ? Number(term.totalCreditHours).toFixed(2) : '',
        '',
        ''
      ]);
      rows.push([
        '',
        'CGPA:',
        term.cumulativeGPA != null ? Number(term.cumulativeGPA).toFixed(2) : '',
        '',
        ''
      ]);
      rows.push([
        '',
        'Major CGPA:',
        term.cumulativeMajorGPA != null ? Number(term.cumulativeMajorGPA).toFixed(2) : '',
        '',
        ''
      ]);
      rows.push([]);
    }

    rows.push(['Overall Total Credit Hours', transcript.totalCreditHours ?? '']);
    rows.push([
      'Overall CGPA',
      transcript.overallCGPA != null ? Number(transcript.overallCGPA).toFixed(2) : ''
    ]);
    rows.push([
      'Major CGPA',
      transcript.majorCGPA != null ? Number(transcript.majorCGPA).toFixed(2) : ''
    ]);

    this.exportWithCustomLayout(rows, fileName, 'Transcript');
  }
}