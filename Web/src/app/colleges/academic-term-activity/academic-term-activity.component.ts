import { Component, OnDestroy, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { AcademicTermActivityModel } from 'src/app/Models/AcademicTermActivityModel';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { AcademicTermActivitiesService } from '../services/academic-term-activities.service';
import { PaginatorService, ServerPaginator } from 'src/app/reports/services/paginator.service';

@Component({
  selector: 'app-academic-term-activity',
  templateUrl: './academic-term-activity.component.html',
  styleUrls: ['./academic-term-activity.component.scss']
})
export class AcademicTermActivityComponent implements OnInit, OnDestroy {
  academicTermActivities: AcademicTermActivityModel[] = [];
  reqId = '';
  checked = false;
  pager: ServerPaginator;

  constructor(
    private _customNotificationService: CustomNotificationService,
    private academicTermActivitiesService: AcademicTermActivitiesService,
    private modal: NzModalService,
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
    this.academicTermActivitiesService
      .getAcademicTermActivityListPaginated(this.pager.query())
      .subscribe({
        next: (res: any) => {
          this.academicTermActivities = res.data || [];
          this.pager.applyResult(res);
        },
        error: (error) => {
          this.academicTermActivities = [];
          this.pager.fail();
          this._customNotificationService.notification(
            'error',
            'Error',
            error.error?.message || 'Failed to fetch batch data. Please check your connection and try again.'
          );
        }
      });
  }

  showDeleteConfirm(id: any): void {
    this.reqId = id;
    this.modal.confirm({
      nzTitle: 'Are you sure delete this Academic Term Activity?',
      nzOkText: 'Yes',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this.academicTermActivitiesService.delete(this.reqId).subscribe((res: any) => {
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

  exportTermActivity() {
    this.academicTermActivitiesService
      .getAcademicTermActivityList()
      .subscribe((res: any) => {
        if (res.data.toString() == "No data found") {
          this._customNotificationService.notification(
            "error",
            "Error",
            res.data
          );
        } else {
          let fileLists = res.data.split("/");
          this.academicTermActivitiesService
            .getAcademicTermActivityList()
            .subscribe((data: any) => {
              let downloadURL = window.URL.createObjectURL(data);
              let link = document.createElement("a");
              link.href = downloadURL;
              link.download = fileLists[fileLists.length - 1];
              link.click();
              this._customNotificationService.notification(
                "success",
                "Success",
                "Excel file is downloaded succesfully."
              );
            });
        }
      });
  }
}
