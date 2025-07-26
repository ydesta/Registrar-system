import { Component, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { BaseModel } from 'src/app/Models/BaseMode';
import { ApplicantHistoryModel } from 'src/app/Models/ApplicantHistoryModel';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';

@Component({
  selector: 'app-applicant-history',
  templateUrl: './applicant-history.component.html',
  styleUrls: ['./applicant-history.component.scss']
})
export class ApplicantHistoryComponent implements OnInit {

  applicantHistoryies?:ApplicantHistoryModel[];
  reqId = '';
  checked = false;
    constructor(private _customNotificationService:CustomNotificationService,private _crudService: CrudService,private modal: NzModalService) { }
  
    ngOnInit(): void {
     this.fetchProgram();
    }
    
    fetchProgram(){
      this._crudService.getList( '/ApplicantHistorys').subscribe((res:BaseModel<ApplicantHistoryModel[]>)=>{
        this.applicantHistoryies =res.data
        })
    }
    showDeleteConfirm(id:any): void {
      this.reqId = id;
      this.modal.confirm({
        nzTitle: 'Are you sure delete this Tuition Fee?',
        nzOkText: 'Yes',
        nzOkType: 'primary',
        nzOkDanger: true,
        nzOnOk: () => {
             this._crudService.delete('/ApplicantHistorys', this.reqId).subscribe((res:any)=>{
              // 
              this.fetchProgram();
              if(res.status ==  "success" ){
          this._customNotificationService.notification('success','Success',res.data)
              }
              if(res.status ==  "error" ){
                this._customNotificationService.notification('error','Error',res.data)
                    }
             })
        },
        nzCancelText: 'No',
        nzOnCancel: () => console.log('Cancel')
      });
    }
  }
  