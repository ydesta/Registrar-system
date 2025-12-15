import { Component, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { environment } from 'src/environments/environment';

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
      this._crudService.getList(`/${environment.apiVersion}/acadamicprogrammecoordinators`).subscribe((res:any)=>{
        // API returns ResponseDtos, which is wrapped in BaseModel by getList()
        // ResponseDtos has Data property, so we need res.data.Data or res.data.data
        this.programCoordinator = res.data?.Data || res.data?.data || res.data
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
             this._crudService.delete(`/${environment.apiVersion}/acadamicprogrammecoordinators`, this.progCoordinorId).subscribe((res:any)=>{
             // API now returns ResponseDtos
              this.fetchProgramCoordinator();
              if(res.status ==  "success" || res.Status == "success"){
          this._customNotificationService.notification('success','Success',res.data || res.Data)
              }
              if(res.status ==  "error" || res.Status == "error"){
                this._customNotificationService.notification('error','Error',res.data || res.Data || res.error || res.Error)
                    }
             })
        },
        nzCancelText: 'No',
        nzOnCancel: () => console.log('Cancel')
      });
    }
   }
   