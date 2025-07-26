import { Component, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { BaseModel } from 'src/app/Models/BaseMode';
import { BankTransactionModel } from 'src/app/Models/BankTransactionModel';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';

@Component({
  selector: 'app-bank-transaction',
  templateUrl: './bank-transaction.component.html',
  styleUrls: ['./bank-transaction.component.scss']
})
export class BankTransactionComponent implements OnInit {

  bankTransactions?: BankTransactionModel[];
  reqId = '';
  checked = false;
  
  // Pagination properties
  pageSize = 10;
  pageindex = 1;
  totalRecord = 0;
  tbLoading = false;
  
  // Search property
  searchKey = '';

  constructor(
    private _customNotificationService: CustomNotificationService,
    private _crudService: CrudService,
    private modal: NzModalService
  ) { }

  ngOnInit(): void {
    this.fetchProgram();
  }

  fetchProgram() {
    this.tbLoading = true;
    this._crudService.getList('/bankTransactions').subscribe((res: BaseModel<BankTransactionModel[]>) => {
      this.bankTransactions = res.data;
      this.totalRecord = res.data?.length || 0;
      this.tbLoading = false;
    }, error => {
      this.tbLoading = false;
      this._customNotificationService.notification('error', 'Error', 'Failed to fetch bank transactions');
    });
  }

  // Search functionality
  onSearch() {
    // Implement search logic here
    console.log('Searching for:', this.searchKey);
  }

  // Export functionality
  exportTransactions() {
    // Implement export logic here
    console.log('Exporting transactions');
    this._customNotificationService.notification('info', 'Info', 'Export functionality will be implemented');
  }

  // Pagination methods
  paginatedIndexEvent(pageIndex: number) {
    this.pageindex = pageIndex;
    this.fetchProgram();
  }

  paginatedSizeEvent(pageSize: number) {
    this.pageSize = pageSize;
    this.pageindex = 1;
    this.fetchProgram();
  }

  // Sorting functionality
  changeSortColumn(event: any, columnName: string) {
    console.log('Sorting by:', columnName, 'Order:', event);
    // Implement sorting logic here
  }

  showDeleteConfirm(id: any): void {
    this.reqId = id;
    this.modal.confirm({
      nzTitle: 'Are you sure delete this Bank Transaction?',
      nzOkText: 'Yes',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this._crudService.delete('/bankTransactions', this.reqId).subscribe((res: any) => {
          this.fetchProgram();
          if (res.status == "success") {
            this._customNotificationService.notification('success', 'Success', res.data)
          }
          if (res.status == "error") {
            this._customNotificationService.notification('error', 'Error', res.data)
          }
        })
      },
      nzCancelText: 'No',
      nzOnCancel: () => console.log('Cancel')
    });
  }
}
  