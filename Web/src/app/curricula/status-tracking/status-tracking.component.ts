import { Component, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';

@Component({
  selector: 'app-status-tracking',
  templateUrl: './status-tracking.component.html',
  styleUrls: ['./status-tracking.component.scss'],
})
export class StatusTrackingComponent implements OnInit {
  statusTrackings: any;
  progId = '';
  checked = false;
  constructor(
    private _customNotificationService: CustomNotificationService,
    private _crudService: CrudService,
    private modal: NzModalService
  ) {}

  ngOnInit(): void {
    this.fetchProgram();
  }
  fetchProgram() {
    this._crudService
      .getList('/CurriculumStatusTrackings')
      .subscribe((res: any) => {
        this.statusTrackings = res.data;
      });
  }
  showDeleteConfirm(id: any): void {
    this.progId = id;
    this.modal.confirm({
      nzTitle: 'Are you sure delete this Status Tracking?',
      // nzContent: '<b style="color: red;">Some descriptions</b>',
      nzOkText: 'Yes',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this._crudService
          .delete('/CurriculumStatusTrackings', this.progId)
          .subscribe((res: any) => {
            
            this.fetchProgram();
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
      nzOnCancel: () => {},
    });
  }

  exportStatusTracking() {}
}
