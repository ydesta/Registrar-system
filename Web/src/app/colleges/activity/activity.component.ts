import { Component, OnDestroy, OnInit, Optional } from '@angular/core';
import { NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { ActivityModel } from 'src/app/Models/ActivityModel';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { AcademicTermActivitiesService } from '../services/academic-term-activities.service';
import { AddActivityComponent } from '../add-activity/add-activity.component';
import { PaginatorService, ServerPaginator } from 'src/app/reports/services/paginator.service';

@Component({
  selector: 'app-activity',
  templateUrl: './activity.component.html',
  styleUrls: ['./activity.component.scss']
})
export class ActivityComponent implements OnInit, OnDestroy {
  activities?: ActivityModel[];
  reqId = '';
  checked = false;
  pager: ServerPaginator;

  constructor(
    private _customNotificationService: CustomNotificationService,
    private academicTermActivitiesService: AcademicTermActivitiesService,
    private modal: NzModalService,
    @Optional() private modalRef: NzModalRef,
    private _modal: NzModalService,
    private paginator: PaginatorService
  ) {
    this.pager = this.paginator.create();
  }

  ngOnInit(): void {
    this.pager.init(() => this.fetchProgram());
    this.fetchProgram();
  }

  ngOnDestroy(): void {
    this.pager.destroy();
  }

  fetchProgram() {
    this.pager.loading = true;
    this.academicTermActivitiesService.getActivityListPaginated(this.pager.query())
      .subscribe({
        next: (res: any) => {
          this.activities = res.data;
          this.pager.applyResult(res);
        },
        error: () => {
          this.activities = [];
          this.pager.fail();
        }
      });
  }

  exportActivities(): void {}

  showDeleteConfirm(id: any): void {
    this.reqId = id;
    this.modal.confirm({
      nzTitle: 'Are you sure delete this Activity?',
      nzOkText: 'Yes',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this.academicTermActivitiesService.deleteActivity(this.reqId).subscribe((res: any) => {
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
      nzOnCancel: () => {}
    });
  }

  openModal(): void {
    const modal: NzModalRef = this._modal.create({
      nzTitle: "📋 Activity Form",
      nzContent: AddActivityComponent,
      nzMaskClosable: false,
      nzFooter: null
    });
    modal.afterClose.subscribe(() => {
      this.fetchProgram();
    });
  }

  closeModal(): void {
    this.modalRef?.close();
  }

  editModal(activity: ActivityModel): void {
    const modal: NzModalRef = this._modal.create({
      nzTitle: "Edit Activity",
      nzContent: AddActivityComponent,
      nzComponentParams: {
        activity: activity
      },
      nzMaskClosable: false,
      nzFooter: null
    });
    modal.afterClose.subscribe(() => {
      this.fetchProgram();
    });
  }
}
