import { Component, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { BaseModel } from 'src/app/Models/BaseMode';
import { StaffModel } from 'src/app/Models/StaffModel';
import { StaffService } from 'src/app/services/staff.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';

@Component({
  selector: 'app-staffs',
  templateUrl: './staffs.component.html',
  styleUrls: ['./staffs.component.scss'],
})
export class StaffsComponent implements OnInit {
  staffs?: StaffModel[];
  reqId = '';
  checked = false;
  searchKey: any;
  
  constructor(
    private _customNotificationService: CustomNotificationService,
    private _staffService: StaffService,
    private modal: NzModalService
  ) {}

  ngOnInit(): void {
    this.fetchStaffs();
  }

  fetchStaffs() {
    this._staffService.getAllStaff().subscribe((res: any) => {
      this.staffs = res.data;
    });
  }

  showDeleteConfirm(id: any): void {
    this.reqId = id;
    this.modal.confirm({
      nzTitle: 'Are you sure delete this Academic Staff?',
      // nzContent: '<b style="color: red;">Some descriptions</b>',
      nzOkText: 'Yes',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this._staffService.deleteStaff(this.reqId).subscribe((res: any) => {
          this.fetchStaffs();
          if (res.status == 'success') {
            this._customNotificationService.notification(
              'success',
              'Success',
              res.data
            );
          }
          if (res.status == 'error') {
            this._customNotificationService.notification(
              'error',
              'Error',
              res.data
            );
          }
        });
      },
      nzCancelText: 'No',
      nzOnCancel: () => console.log('Cancel'),
    });
  }

  clickSearchKey() {}

  exportStaff() {
    this._staffService.exportStaffData('excel').subscribe((data: any) => {
      let downloadURL = window.URL.createObjectURL(data);
      let link = document.createElement('a');
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
