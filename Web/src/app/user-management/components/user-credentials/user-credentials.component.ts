import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { UserManagementService } from '../../../services/user-management.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { environment } from '../../../../environments/environment';
import * as XLSX from 'xlsx';

export interface UserCredential {
  id: number;
  firstName: string;
  fatherName: string;
  email: string;
  password: string;
  createdAt: string;
}

export interface UserCredentialsResponse {
  success: boolean;
  message: string;
  userCredentials: UserCredential[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

@Component({
  selector: 'app-user-credentials',
  templateUrl: './user-credentials.component.html',
  styleUrls: ['./user-credentials.component.scss']
})
export class UserCredentialsComponent implements OnInit {
  searchForm: FormGroup;
  loading = false;
  userCredentials: UserCredential[] = [];
  listOfDisplayData: UserCredential[] = [];
  totalCount = 0;
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  isSearchCollapsed = false;
  searchValue = '';

  constructor(
    private fb: FormBuilder,
    private userManagementService: UserManagementService,
    private message: NzMessageService
  ) {
    this.searchForm = this.fb.group({
      fromDate: [null],
      toDate: [null],
      emailFilter: ['']
    });
  }

  ngOnInit(): void {
    this.loadUserCredentials();
  }

  loadUserCredentials(): void {
    this.loading = true;
    const formValue = this.searchForm.value;
    this.userManagementService.getUserCredentials({
      fromDate: formValue.fromDate,
      toDate: formValue.toDate,
      page: this.currentPage,
      pageSize: this.pageSize,
      emailFilter: formValue.emailFilter || null,
      sortBy: 'CreatedAt',
      sortDescending: true
    }).subscribe({
      next: (response: UserCredentialsResponse) => {
        if (response.success) {
          this.userCredentials = response.userCredentials;
          this.listOfDisplayData = [...this.userCredentials];
          this.totalCount = response.totalCount;
          this.totalPages = response.totalPages;
        } else {
          this.message.error(response.message || 'Failed to load user credentials');
        }
        this.loading = false;
      },
      error: (error) => {
        this.message.error(this.credentialsError(error, 'Failed to load user credentials'));
        this.loading = false;
      }
    });
  }

  search(): void {
    if (!this.searchValue) {
      this.listOfDisplayData = [...this.userCredentials];
      return;
    }
    const key = this.searchValue.toLowerCase();
    this.listOfDisplayData = this.userCredentials.filter(credential =>
      credential.email.toLowerCase().includes(key)
    );
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadUserCredentials();
  }

  onReset(): void {
    this.searchForm.reset();
    this.currentPage = 1;
    this.loadUserCredentials();
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.message.success('Copied to clipboard');
    }).catch(() => {
      this.message.error('Failed to copy to clipboard');
    });
  }

  testApiConnection(): void {
    this.loadUserCredentials();
  }

  trackByFn(index: number, item: UserCredential): number {
    return item.id;
  }

  exportToExcel(): void {
    this.loading = true;
    const formValue = this.searchForm.value;
    this.userManagementService.getUserCredentialsForExport({
      fromDate: formValue.fromDate,
      toDate: formValue.toDate,
      emailFilter: formValue.emailFilter || null,
      sortBy: 'CreatedAt',
      sortDescending: true
    }).subscribe({
      next: (response: UserCredentialsResponse) => {
        if (response.success && response.userCredentials) {
          this.generateExcelFile(response.userCredentials);
          this.message.success(`Successfully exported ${response.userCredentials.length} records to Excel`);
        } else {
          this.message.error(response.message || 'Failed to export data');
        }
        this.loading = false;
      },
      error: (error) => {
        this.message.error(this.credentialsError(error, 'Failed to export to Excel'));
        this.loading = false;
      }
    });
  }

  onPageIndexChange(pageIndex: number): void {
    this.currentPage = pageIndex;
    this.loadUserCredentials();
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize = pageSize;
    this.currentPage = 1;
    this.loadUserCredentials();
  }

  onCurrentPageDataChange(_listOfCurrentPageData: readonly UserCredential[]): void {
  }

  private generateExcelFile(data: UserCredential[]): void {
    const excelData = data.map(item => ({
      ID: item.id,
      Email: item.email,
      Password: item.password,
      'Created At': this.formatDateForExcel(item.createdAt)
    }));
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(excelData);
    ws['!cols'] = [{ wch: 8 }, { wch: 30 }, { wch: 20 }, { wch: 25 }];
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'User Credentials');
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    XLSX.writeFile(wb, `User_Credentials_${timestamp}.xlsx`);
  }

  private formatDateForExcel(dateString: string): string {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }

  private credentialsError(error: any, fallback: string): string {
    if (error.status === 403) {
      return 'Access denied. You do not have permission to view user credentials. Please contact your administrator.';
    }
    if (error.status === 404) {
      return 'API endpoint not found. Please ensure the SecureAuth API is running.';
    }
    if (error.status === 0) {
      return `Cannot connect to API server. Please check if the server is running on ${environment.secureUrl}`;
    }
    return `${fallback}: ${error.message || 'Unknown error'}`;
  }
}
