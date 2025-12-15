import { Component, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { BaseModel } from 'src/app/Models/BaseMode';
import { AcademicTermActivityModel } from 'src/app/Models/AcademicTermActivityModel';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { AcademicTermActivitiesService } from '../services/academic-term-activities.service';

@Component({
  selector: 'app-academic-term-activity',
  templateUrl: './academic-term-activity.component.html',
  styleUrls: ['./academic-term-activity.component.scss']
})
export class AcademicTermActivityComponent implements OnInit {
  academicTermActivities?: AcademicTermActivityModel[];
  reqId = '';
  checked = false;
  pageIndex = 1;
  pageSize = 10;
  pageSizeOption = [5, 10, 15, 25, 50, 100];
  total = 0;
  isLoading = true;
  sortOrder = "";
  sortColumn = "";
  
  constructor(
    private _customNotificationService: CustomNotificationService,
    private academicTermActivitiesService: AcademicTermActivitiesService,
    private modal: NzModalService) { }

  ngOnInit(): void {
    this.fetchProgram();
  }

  fetchProgram() {
    this.isLoading = true;
    this.academicTermActivitiesService
      .getAcademicTermActivityList()
      .subscribe({
        next: (res: BaseModel<AcademicTermActivityModel[]>) => {
          this.academicTermActivities = res.data;
          this.total = res.data.length;
          this.isLoading = false;
        },
        error: (error) => {
          this._customNotificationService.notification(
            'error',
            'Error',
            error.error?.message || 'Failed to fetch batch data. Please check your connection and try again.'
          );
          this.isLoading = false;
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
  onPageIndexChange(page: number): void {
    this.pageIndex = page;
    this.fetchProgram();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageIndex = 1;
    this.fetchProgram();
  }

}
