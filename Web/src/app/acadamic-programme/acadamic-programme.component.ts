import { Component, OnInit, OnDestroy } from '@angular/core';
import { CrudService } from '../services/crud.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import { CustomNotificationService } from '../services/custom-notification.service';
@Component({
  selector: 'app-acadamic-program',
  templateUrl: './acadamic-programme.component.html',
  styleUrls: ['./acadamic-programme.component.scss'],
})
export class AcadamicProgrammeComponent implements OnInit, OnDestroy {
  acadamicPrograms: any;
  progId: any;
  dateTime = Date.now();
  checked = false;
  pageindex = 1;
  totalRecord = 0;
  pageSize = 5;
  sortOrder = '';
  sortColumn = '';
  searchKey = '';
  tbLoading = true;
  pageSizeOption = [5, 10, 15, 25, 50, 100];
  constructor(
    private _customNotificationService: CustomNotificationService,
    private _crudService: CrudService,
    private modal: NzModalService
  ) {
  }

  ngOnInit(): void {
    this.fetchProgram();
  }

  ngOnDestroy(): void {
  }

  fetchProgram() {
    this.tbLoading = true;
    this._crudService
      .getList(
        '/AcadamicProgramme/paginated?searchKey=' +
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
        this.acadamicPrograms = res.data;
        this.totalRecord = res.totalRowCount;
        this.tbLoading = false;
      //  
        this.pageSize = res.itemPerPage;
        this.pageindex = res.currentPage + 1;
        this.totalRecord = res.totalRowCount;
      });
  }
  clickSearchKey() {
    this.fetchProgram();
  }

  onSearch() {
    this.pageindex = 1;
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
  changeSortColumn(event: any, column: string) {
    this.sortOrder =
      event == 'descend'
        ? (event + '').substring(0, 4)
        : (event + '').substring(0, 3);
    this.sortColumn = column;
    this.fetchProgram();
  }

  showDeleteConfirm(id: any): void {
    this.progId = id;
    this.modal.confirm({
      nzTitle: 'Are you sure delete this program?',
      // nzContent: '<b style="color: red;">Some descriptions</b>',
      nzOkText: 'Yes',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this._crudService
          .delete('/AcadamicProgramme', this.progId)
          .subscribe((res: any) => {
          //  
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

  exportAcadamicProgram() {
    this._crudService
      .getList('/AcadamicProgramme/excel')
      .subscribe((res: any) => {
        //acadamic-programme
        if (res.data.toString() == 'No data found') {
          this._customNotificationService.notification(
            'error',
            'Error',
            res.data
          );
        } else {
          let fileLists = res.data.split('/');
          this._crudService
            .expoerExcel('/' + res.data)
            .subscribe((data: any) => {
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
}
