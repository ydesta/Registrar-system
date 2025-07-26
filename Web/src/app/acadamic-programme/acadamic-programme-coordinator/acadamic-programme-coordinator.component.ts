import { Component, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';

@Component({
  selector: 'app-acadamic-program-coordinator',
  templateUrl: './acadamic-programme-coordinator.component.html',
  styleUrls: ['./acadamic-programme-coordinator.component.scss']
})
export class AcadamicProgrammeCoordinatorComponent implements OnInit {
  programCoordinator:any;
  progCoordinorId = '';
  checked = false;
  constructor(private _customNotificationService:CustomNotificationService,private _crudService: CrudService,private modal: NzModalService) { }
   
     ngOnInit(): void {
    this.fetchProgramCoordinator();
     }
     fetchProgramCoordinator(){
      this._crudService.getList('/AcadamicProgrammeCoordinators').subscribe((res:any)=>{
        this.programCoordinator =res.data
        })
     }
     showDeleteConfirm(id:any): void {
      this.progCoordinorId = id;
      this.modal.confirm({
        nzTitle: 'Are you sure delete this program coordinator?',
        // nzContent: '<b style="color: red;">Some descriptions</b>',
        nzOkText: 'Yes',
        nzOkType: 'primary',
        nzOkDanger: true,
        nzOnOk: () => {
             this._crudService.delete('/AcadamicProgrammeCoordinators', this.progCoordinorId).subscribe((res:any)=>{
             // 
              this.fetchProgramCoordinator();
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
   