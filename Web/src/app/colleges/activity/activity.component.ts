import { Component, OnInit } from '@angular/core';
import { NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { BaseModel } from 'src/app/Models/BaseMode';
import { ActivityModel } from 'src/app/Models/ActivityModel';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { AcademicTermActivitiesService } from '../services/academic-term-activities.service';
import { AddActivityComponent } from '../add-activity/add-activity.component';

@Component({
  selector: 'app-activity',
  templateUrl: './activity.component.html',
  styleUrls: ['./activity.component.scss']
})
export class ActivityComponent implements OnInit {
  activities?: ActivityModel[];
  reqId = '';
  checked = false;
  
  // Search and pagination properties
  searchKey: string = '';
  pageSize: number = 10;
  pageSizeOption: number[] = [10, 20, 50, 100];
  totalRecord: number = 0;
  pageindex: number = 1;
  isLoading: boolean = false;

  constructor(private _customNotificationService: CustomNotificationService,
    private academicTermActivitiesService: AcademicTermActivitiesService,
    private modal: NzModalService,
    private modalRef: NzModalRef,
    private _modal: NzModalService) { }

  ngOnInit(): void {
    this.fetchProgram();
  }

  fetchProgram() {
    this.isLoading = true;
    this.academicTermActivitiesService.getActivityList()
      .subscribe((res: BaseModel<ActivityModel[]>) => {
        this.activities = res.data;
        this.totalRecord = this.activities?.length || 0;
        this.isLoading = false;
      }, error => {
        this.isLoading = false;
      })
  }

  // Search functionality
  clickSearchKey(): void {
    // Implement search logic here
    console.log('Searching for:', this.searchKey);
    // You can filter the activities based on searchKey
    // For now, just refetch all data
    this.fetchProgram();
  }

  // Export functionality
  exportActivities(): void {
    // Implement export logic here
    console.log('Exporting activities...');
    // You can implement CSV/Excel export functionality
  }

  // Pagination methods
  paginatedIndexEvent(pageIndex: number): void {
    this.pageindex = pageIndex;
    this.fetchProgram();
  }

  paginatedSizeEvent(pageSize: number): void {
    this.pageSize = pageSize;
    this.pageindex = 1; // Reset to first page
    this.fetchProgram();
  }

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
      nzOnCancel: () => console.log('Cancel')
    });
  }
  openModal(): void {
    const modal: NzModalRef = this._modal.create({
      nzTitle: "📋 Activity Form",
      nzContent: AddActivityComponent,
      // nzComponentParams: {
      //   applicationId: this.applicantId
      // },
      nzMaskClosable: false,
      nzFooter: null
    });
    modal.afterClose.subscribe(() => {
      this.fetchProgram();
    });
  }
  closeModal(): void {
    this.modalRef.close();
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
