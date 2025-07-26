import { Component, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { BaseModel } from 'src/app/Models/BaseMode';
import { CourseEquivalentModel } from 'src/app/Models/CourseEquivalentModel';
import { CourseModel } from 'src/app/Models/CourseModel';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';

@Component({
  selector: 'app-course-equivalent',
  templateUrl: './course-equivalent.component.html',
  styleUrls: ['./course-equivalent.component.scss']
})
export class CourseEquivalentComponent implements OnInit {

  courseEquivalents?:CourseEquivalentModel[];
  reqId = '';
  checked = false;
    constructor(private _customNotificationService:CustomNotificationService,private _crudService: CrudService,private modal: NzModalService) { }
  
    ngOnInit(): void {
     this.fetchProgram();
    }
    
    fetchProgram(){
      this._crudService.getList( '/CourseEquivalents').subscribe((res:BaseModel<CourseEquivalentModel[]>)=>{
        this.courseEquivalents =res.data
        })
    }
    showDeleteConfirm(id:any): void {
      this.reqId = id;
      this.modal.confirm({
        nzTitle: 'Are you sure delete this course?',
        // nzContent: '<b style="color: red;">Some descriptions</b>',
        nzOkText: 'Yes',
        nzOkType: 'primary',
        nzOkDanger: true,
        nzOnOk: () => {
             this._crudService.delete('/CourseEquivalents', this.reqId).subscribe((res:any)=>{
              
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
  