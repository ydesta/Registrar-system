import { Component, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzUploadFile, NzUploadXHRArgs } from 'ng-zorro-antd/upload';
import { UserManagementService } from '../../../services/user-management.service';
import { BulkUpdateFromExcelResult } from '../../../services/user-management.interface';

@Component({
  selector: 'app-update-from-excel',
  templateUrl: './update-from-excel.component.html',
  styleUrls: ['./update-from-excel.component.scss']
})
export class UpdateFromExcelComponent {
  selectedFile: File | null = null;
  uploading = false;
  result: BulkUpdateFromExcelResult | null = null;

  constructor(
    private userManagementService: UserManagementService,
    private message: NzMessageService,
    private cdr: ChangeDetectorRef
  ) {}

  beforeUpload = (file: NzUploadFile, _fileList: NzUploadFile[]): boolean => {
    const raw = file.originFileObj as File | undefined;
    const name = raw?.name ?? file.name ?? '';
    const ext = name.toLowerCase().slice(name.lastIndexOf('.'));
    if (ext !== '.xlsx' && ext !== '.xls') {
      this.message.error('Only .xlsx or .xls files are allowed.');
      return false;
    }
    this.selectedFile = raw ?? null;
    this.result = null;
    this.cdr.detectChanges();
    return true;
  };

  handleChange(event: { file: NzUploadFile; fileList: NzUploadFile[] }): void {
    const raw = event?.file?.originFileObj as File | undefined;
    if (raw instanceof File) {
      this.selectedFile = raw;
      this.result = null;
      this.cdr.detectChanges();
    }
  }

  customRequest = (item: NzUploadXHRArgs): Subscription => {
    const file = (item.file.originFileObj || item.file) as File;
    if (!file || !(file instanceof File)) {
      this.message.error('No file to upload.');
      this.uploading = false;
      item.onError!(new Error('No file'), item.file);
      this.cdr.detectChanges();
      return new Subscription();
    }
    this.selectedFile = file;
    this.uploading = true;
    this.result = null;
    this.cdr.detectChanges();
    return this.userManagementService.updateUsersFromExcel(file).subscribe({
      next: (res: any) => {
        const result = this.normalizeResult(res);
        this.finishUpload(result);
        item.onSuccess!(result, item.file, null);
      },
      error: (err) => {
        this.uploading = false;
        this.cdr.detectChanges();
        this.message.error(err?.error?.message || err?.message || 'Failed to process Excel file.');
        item.onError!(err, item.file);
      }
    });
  };

  clearFile(): void {
    this.selectedFile = null;
    this.result = null;
    this.uploading = false;
    this.cdr.detectChanges();
  }

  processFile(): void {
    if (!this.selectedFile) {
      this.message.warning('Please select an Excel file first.');
      return;
    }
    this.uploading = true;
    this.result = null;
    this.cdr.detectChanges();
    this.userManagementService.updateUsersFromExcel(this.selectedFile).subscribe({
      next: (res: any) => this.finishUpload(this.normalizeResult(res)),
      error: (err) => {
        this.uploading = false;
        this.cdr.detectChanges();
        this.message.error(err?.error?.message || 'Failed to process Excel file.');
      }
    });
  }

  private finishUpload(result: BulkUpdateFromExcelResult): void {
    this.uploading = false;
    this.result = result;
    this.cdr.detectChanges();
    const sc = result.successCount;
    const fc = result.failureCount;
    const errs = result.errors || [];
    if (fc === 0 && errs.length === 0) {
      this.message.success(`Successfully updated ${sc} user(s).`);
      return;
    }
    if (sc > 0) {
      this.message.warning(`Updated ${sc} user(s). ${fc} failed.`);
      return;
    }
    this.message.error(`All rows failed. Check errors below (e.g. 'olduser' must match existing username/email; 'newemail' required).`);
  }

  private normalizeResult(res: any): BulkUpdateFromExcelResult {
    const rawErrors = res?.errors ?? res?.Errors ?? [];
    return {
      successCount: res?.successCount ?? res?.SuccessCount ?? 0,
      failureCount: res?.failureCount ?? res?.FailureCount ?? 0,
      errors: Array.isArray(rawErrors)
        ? rawErrors.map((e: any) => ({
            rowNumber: e.rowNumber ?? e.RowNumber ?? 0,
            oldUser: e.oldUser ?? e.OldUser,
            message: e.message ?? e.Message ?? ''
          }))
        : []
    };
  }
}
