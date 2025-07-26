import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { BaseModel } from '../Models/BaseMode';
import { CourseModel } from '../Models/CourseModel';
import { CrudService } from '../services/crud.service';
import { CustomNotificationService } from '../services/custom-notification.service';

@Component({
  selector: 'app-course',
  templateUrl: './course.component.html',
  styleUrls: ['./course.component.scss'],
})
export class CourseComponent implements OnInit {
  courses?: CourseModel[];
  reqId = '';
  checked = false;
  pageindex = 1;
  totalRecord = 0;
  pageSize = 5;
  pageSizeOption = [5, 10, 15, 25, 50, 100];
  sortOrder = '';
  sortColumn = '';
  searchKey = '';
  isLoading = false;
  @ViewChild('emptyTpl') emptyTpl!: TemplateRef<void>;
  constructor(
    private _customNotificationService: CustomNotificationService,
    private _crudService: CrudService,
    private modal: NzModalService
  ) {}

  ngOnInit(): void {
    this.fetchProgram();
  }

  paginatedIndexEvent(event: any) {
    this.pageindex = event;
    this.fetchProgram();
  }
  paginatedSizeEvent(event: any) {
    this.pageSize = event;
    this.fetchProgram();
  }

  fetchProgram() {
    this._crudService
      .getList(
        '/Courses/paginated?searchKey=' +
          this.searchKey +
          '&pageindex=' +
          (this.pageindex - 1) +
          '&pageSize=' +
          this.pageSize +
          '&sortColumn=' +
          this.sortColumn +
          '&sortOrder=' +
          this.sortOrder
      )
      .subscribe((res: any) => {
        this.courses = res.data;
        this.pageSize = res.itemPerPage;
        this.pageindex = res.currentPage + 1;
        this.totalRecord = res.totalRowCount;
      });
  }
  showDeleteConfirm(id: any): void {
    this.reqId = id;
    this.modal.confirm({
      nzTitle: 'Are you sure delete this course?',
      // nzContent: '<b style="color: red;">Some descriptions</b>',
      nzOkText: 'Yes',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this._crudService
          .delete('/Courses', this.reqId)
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
      nzOnCancel: () => console.log('Cancel'),
    });
  }

  exportCourses() {
    this._crudService.getList('/Courses/excel').subscribe((res: any) => {
      if (res.data.toString() == 'No data found') {
        this._customNotificationService.notification(
          'error',
          'Error',
          res.data
        );
      } else {
        let fileLists = res.data.split('/');
        this._crudService.expoerExcel('/' + res.data).subscribe((data: any) => {
          let downloadURL = window.URL.createObjectURL(data);
          let link = document.createElement('a');
          link.href = downloadURL;
          link.download = fileLists[fileLists.length - 1];
          link.click();
          this._customNotificationService.notification(
            'success',
            'Success',
            'Excel file is downloaded succesfully.'
          );
        });
      }
    });
  }

  clickSearchKey() {
    this.fetchProgram();
  }
}
