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
    console.log('UserCredentialsComponent initialized');
    console.log('Current user role:', localStorage.getItem('role'));
    console.log('Current user type:', localStorage.getItem('userType'));
    
    // Test API connection first
    this.testApiConnection();
  }

  testApiConnection(): void {
    console.log('Testing API connection...');
    this.userManagementService.testApiConnection().subscribe({
      next: (response) => {
        console.log('API connection test successful:', response);
        this.loadUserCredentials();
      },
      error: (error) => {
        console.error('API connection test failed:', error);
        
        if (error.status === 404) {
          this.message.error(`API server not found. Please ensure the SecureAuth API is running on ${environment.secureUrl}`);
        } else if (error.status === 0) {
          this.message.error(`Cannot connect to API server. Please check if the server is running on ${environment.secureUrl}`);
        } else {
          this.message.error(`API connection failed: ${error.message || 'Unknown error'}`);
        }
      }
    });
  }

  loadUserCredentials(): void {
    this.loading = true;
    const formValue = this.searchForm.value;
    
    console.log('Loading user credentials with params:', {
      fromDate: formValue.fromDate,
      toDate: formValue.toDate,
      page: this.currentPage,
      pageSize: this.pageSize,
      emailFilter: formValue.emailFilter || null,
      sortBy: 'CreatedAt',
      sortDescending: true
    });
    
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
        console.error('Error loading user credentials:', error);
        
        if (error.status === 403) {
          this.message.error('Access denied. You do not have permission to view user credentials. Please contact your administrator.');
        } else if (error.status === 404) {
          this.message.error('API endpoint not found. Please ensure the SecureAuth API is running.');
        } else if (error.status === 0) {
          this.message.error(`Cannot connect to API server. Please check if the server is running on ${environment.secureUrl}`);
        } else {
          this.message.error(`Failed to load user credentials: ${error.message || 'Unknown error'}`);
        }
        
        this.loading = false;
      }
    });
  }

  search(): void {
    if (!this.searchValue) {
      this.listOfDisplayData = [...this.userCredentials];
      return;
    }
    
    this.listOfDisplayData = this.userCredentials.filter(credential =>
      credential.email.toLowerCase().includes(this.searchValue.toLowerCase())
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
        console.error('Error exporting to Excel:', error);
        
        if (error.status === 403) {
          this.message.error('Access denied. You do not have permission to export user credentials.');
        } else if (error.status === 404) {
          this.message.error('API endpoint not found. Please ensure the SecureAuth API is running.');
        } else if (error.status === 0) {
          this.message.error(`Cannot connect to API server. Please check if the server is running on ${environment.secureUrl}`);
        } else {
          this.message.error(`Failed to export to Excel: ${error.message || 'Unknown error'}`);
        }
        
        this.loading = false;
      }
    });
  }

  private generateExcelFile(data: UserCredential[]): void {
    // Prepare data for Excel
    const excelData = data.map(item => ({
      'ID': item.id,
      'Email': item.email,
      'Password': item.password,
      'Created At': this.formatDateForExcel(item.createdAt)
    }));

    // Create workbook and worksheet
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(excelData);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'User Credentials');

    // Set column widths
    const colWidths = [
      { wch: 8 },   // ID
      { wch: 30 },  // Email
      { wch: 20 },  // Password
      { wch: 25 }   // Created At
    ];
    ws['!cols'] = colWidths;

    // Generate filename with current date and time
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `User_Credentials_${timestamp}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);
  }

  private formatDateForExcel(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }

  // Pagination methods
  onPageIndexChange(pageIndex: number): void {
    console.log('Page index changed to:', pageIndex);
    this.currentPage = pageIndex;
    this.loadUserCredentials();
  }

  onPageSizeChange(pageSize: number): void {
    console.log('Page size changed to:', pageSize);
    this.pageSize = pageSize;
    this.currentPage = 1; // Reset to first page when changing page size
    this.loadUserCredentials();
  }

  onCurrentPageDataChange(listOfCurrentPageData: readonly UserCredential[]): void {
    console.log('Current page data changed:', listOfCurrentPageData);
    // This method is called when the current page data changes
    // Useful for tracking which items are currently visible
  }
}
