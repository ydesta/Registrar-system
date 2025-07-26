import { Component, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { BaseModel } from 'src/app/Models/BaseMode';
import { ApplicantEducationModel } from 'src/app/Models/ApplicantEducationModel';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';

@Component({
  selector: 'app-applicant-education-background',
  templateUrl: './applicant-education-background.component.html',
  styleUrls: ['./applicant-education-background.component.scss']
})
export class ApplicantEducationBackgroundComponent implements OnInit {
  applicantEducationBackgrounds?:ApplicantEducationModel[];
  reqId = '';
  checked = false;
    constructor(private _customNotificationService:CustomNotificationService,private _crudService: CrudService,private modal: NzModalService) { }
  
    ngOnInit(): void {
     this.fetchProgram();
    }
    
    fetchProgram(){
      this._crudService.getList( '/ApplicantEducationBackgrounds').subscribe((res:BaseModel<ApplicantEducationModel[]>)=>{
        this.applicantEducationBackgrounds =res.data
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
             this._crudService.delete('/ApplicantEducationBackgrounds', this.reqId).subscribe((res:any)=>{
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
  