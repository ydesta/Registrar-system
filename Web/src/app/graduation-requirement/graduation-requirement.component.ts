import { Component, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { CrudService } from '../services/crud.service';
import { CustomNotificationService } from '../services/custom-notification.service';

@Component({
  selector: 'app-graduation-requirement',
  templateUrl: './graduation-requirement.component.html',
  styleUrls: ['./graduation-requirement.component.scss']
})
export class GraduationRequirementComponent implements OnInit {

  requirements:any;
  reqId = '';
  checked = false;
    constructor(private _customNotificationService:CustomNotificationService,private _crudService: CrudService,private modal: NzModalService) { }
  
    ngOnInit(): void {
     this.fetchProgram();
    }
    fetchProgram(){
      this._crudService.getList('/GraduationRequirements').subscribe((res:any)=>{
        this.requirements =res.data
        })
    }
    showDeleteConfirm(id:any): void {
      this.reqId = id;
      this.modal.confirm({
        nzTitle: 'Are you sure delete this graduation requirement?',
        // nzContent: '<b style="color: red;">Some descriptions</b>',
        nzOkText: 'Yes',
        nzOkType: 'primary',
        nzOkDanger: true,
        nzOnOk: () => {
             this._crudService.delete('/GraduationRequirements', this.reqId).subscribe((res:any)=>{
              
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
  