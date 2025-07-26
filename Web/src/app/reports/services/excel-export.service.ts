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
}