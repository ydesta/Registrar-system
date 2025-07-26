
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';

@Component({
  selector: 'app-add-acadamic-programme-coordinator',
  templateUrl: './add-acadamic-programme-coordinator.component.html',
  styleUrls: ['./add-acadamic-programme-coordinator.component.scss']
})
export class AddAcadamicProgrammeCoordinatorComponent implements OnInit {
  action = 'Add Acadamic programme Cordinator';
  acadamicProgramCoordinatorForm:FormGroup;
  acadamicPrograms:any;
  progCoordinatorId : any;
  submit ='Save';
constructor(
  public aciveRoute : ActivatedRoute,
  private _route:Router, private _fb:FormBuilder,private _crudService: CrudService, private _customNotificationService:CustomNotificationService) {
  this.acadamicProgramCoordinatorForm = this._fb.group({
    createdBy :  ['-'] ,
   lastModifiedBy :  ['-'] ,
   staffId :  ['',Validators.required] ,
   startDate :  [null,Validators.required] ,
   endDate :  [null,Validators.required] ,
   remark :  [''] ,
   acadamicProgrammeCode : ['',Validators.required]
  });
 }

ngOnInit(): void {
  this.progCoordinatorId = this.aciveRoute.snapshot.paramMap.get('id');
  if(this.progCoordinatorId!="null"){
    this.action="Edit Programme Coordinator"
    this.submit ='Update';
    this._crudService.getList('/AcadamicProgrammeCoordinators' + '/' + this.progCoordinatorId).subscribe((data:any)=>{
      this.patchValues(data);
    });
  }
  this._crudService.getList( '/AcadamicProgramme').subscribe((res:any)=>{
  this.acadamicPrograms =res.data
});}
submitForm(){
 if(this.acadamicProgramCoordinatorForm.valid){
  if(this.progCoordinatorId =="null") {
  this._crudService.add('/AcadamicProgrammeCoordinators',this.acadamicProgramCoordinatorForm.value).subscribe((res:any)=>{
    this._customNotificationService.notification('success','Success','Acadamic Programme Coordinator registered successfully.');
    this._route.navigateByUrl('acadamic-program/program-coordinator');
  })}
  else if(this.progCoordinatorId!="null") {
    if(this.acadamicProgramCoordinatorForm.valid){
      this._crudService.update('/AcadamicProgrammeCoordinators' ,this.progCoordinatorId,this.acadamicProgramCoordinatorForm.value).subscribe((res:any)=>{
       if(res.status == 'success'){
        this._customNotificationService.notification('success','Success',res.data);
        this._route.navigateByUrl('acadamic-program/program-coordinator');
       }
       else{
          this._customNotificationService.notification('error','Error',res.data);
         
       }
      })
     }
    
   }
 }
 else{
  this._customNotificationService.notification('error','error','Enter valid data.');
 }
}
patchValues(data: any) {
 // 
  this.acadamicProgramCoordinatorForm.patchValue({
    staffId:data.staffId,
    startDate:data.startDate,
    endDate:data.endDate,
    remark:data.remark,
    acadamicProgrammeCode: data.acadamicProgrammeCode,
 })
}
}
