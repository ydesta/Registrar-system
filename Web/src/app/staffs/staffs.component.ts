import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { StaffModel } from 'src/app/Models/StaffModel';
import { PaginatorService, ServerPaginator } from 'src/app/reports/services/paginator.service';
import { StaffService } from 'src/app/services/staff.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-staffs',
  templateUrl: './staffs.component.html',
  styleUrls: ['./staffs.component.scss'],
})
export class StaffsComponent implements OnInit, OnDestroy {
  staffs?: StaffModel[];
  reqId = '';
  checked = false;
  pager: ServerPaginator;

  constructor(
    private _customNotificationService: CustomNotificationService,
    private _staffService: StaffService,
    private modal: NzModalService,
    private router: Router,
    private paginator: PaginatorService,
    private authService: AuthService
  ) {
    this.pager = this.paginator.create();
  }

  ngOnInit(): void {
    if (this.authService.hasRole('Instructor')) {
      this.router.navigate(['/staffs/staff-profile']);
      return;
    }
    this.pager.init(() => this.fetchStaffs());
    this.fetchStaffs();
  }

  ngOnDestroy(): void {
    this.pager.destroy();
  }

  fetchStaffs() {
    this.pager.loading = true;
    this._staffService.getStaffsPaginated(this.pager.query()).subscribe({
      next: (res: any) => {
        this.staffs = res.data;
        this.pager.applyResult(res);
      },
      error: () => {
        this.staffs = [];
        this.pager.fail();
      }
    });
  }

  showDeleteConfirm(id: any): void {
    this.reqId = id;
    this.modal.confirm({
      nzTitle: 'Are you sure delete this Academic Staff?',
      nzOkText: 'Yes',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this._staffService.deleteStaff(this.reqId).subscribe((res: any) => {
          this.fetchStaffs();
          if (res.status == 'success') {
            this._customNotificationService.notification('success', 'Success', res.data);
          }
          if (res.status == 'error') {
            this._customNotificationService.notification('error', 'Error', res.data);
          }
        });
      },
      nzCancelText: 'No'
    });
  }

  exportStaff() {
    this._staffService.exportStaffData('excel').subscribe((data: any) => {
      const downloadURL = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = downloadURL;
      link.download = 'staffs.xlsx';
      link.click();
      this._customNotificationService.notification(
        'success',
        'Success',
        'Excel file is downloaded successfully.'
      );
    });
  }
}
