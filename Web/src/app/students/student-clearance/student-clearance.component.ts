import { Component, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { BaseModel } from 'src/app/Models/BaseMode';
import { StudentClearanceModel } from 'src/app/Models/StudentClearanceModel';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';

@Component({
  selector: 'app-student-clearance',
  templateUrl: './student-clearance.component.html',
  styleUrls: ['./student-clearance.component.scss']
})
export class StudentClearanceComponent implements OnInit {

  studentClearances?:StudentClearanceModel[];
  reqId = '';
  checked = false;
    constructor(private _customNotificationService:CustomNotificationService,private _crudService: CrudService,private modal: NzModalService) { }
  
    ngOnInit(): void {
     this.fetchProgram();
    }
    
    fetchProgram(){
      this._crudService.getList( '/StudentClearances').subscribe((res:BaseModel<StudentClearanceModel[]>)=>{
        this.studentClearances =res.data
        })
    }
    showDeleteConfirm(id:any): void {
      this.reqId = id;
      this.modal.confirm({
        nzTitle: 'Are you sure delete this Student Clearance?',
        nzOkText: 'Yes',
        nzOkType: 'primary',
        nzOkDanger: true,
        nzOnOk: () => {
             this._crudService.delete('/StudentClearances', this.reqId).subscribe((res:any)=>{
              
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
  