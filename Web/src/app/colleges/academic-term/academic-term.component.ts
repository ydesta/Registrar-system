import { Component, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { BaseModel } from 'src/app/Models/BaseMode';
import { AcademicTermModel } from 'src/app/Models/AcademicTermModel';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';

@Component({
  selector: 'app-academic-term',
  templateUrl: './academic-term.component.html',
  styleUrls: ['./academic-term.component.scss'],
})
export class AcademicTermComponent implements OnInit {
  academicTerms?: AcademicTermModel[];
  reqId = '';
  checked = false;
  constructor(
    private _customNotificationService: CustomNotificationService,
    private _crudService: CrudService,
    private modal: NzModalService
  ) {}

  ngOnInit(): void {
    this.fetchAcademicTerms();
  }

  fetchAcademicTerms() {
    this._crudService
      .getList('/AcademicTerms')
      .subscribe((res: BaseModel<AcademicTermModel[]>) => {
        this.academicTerms = res.data;
      });
  }
  showDeleteConfirm(id: any): void {
    this.reqId = id;
    this.modal.confirm({
      nzTitle: 'Are you sure delete this Academic Term?',
      // nzContent: '<b style="color: red;">Some descriptions</b>',
      nzOkText: 'Yes',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this._crudService
          .delete('/AcademicTerms', this.reqId)
          .subscribe((res: any) => {
            
            this.fetchAcademicTerms();
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
  exportAcademicTerm() {
    this._crudService.getList('/AcademicTerms/excel').subscribe((res: any) => {
      //acadamic-programme
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
}
