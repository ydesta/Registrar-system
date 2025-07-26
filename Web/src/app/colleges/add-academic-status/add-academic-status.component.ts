import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';

@Component({
  selector: 'app-add-academic-status',
  templateUrl: './add-academic-status.component.html',
  styleUrls: ['./add-academic-status.component.scss']
})
export class AddAcademicStatusComponent implements OnInit {
  action = 'Add Academic Status';
  acadamicStatusForm:FormGroup;
  acadamicPrograms:any;
  progStatusId:any;
  submit ='Submit';
constructor(
  public aciveRoute:ActivatedRoute,
  private _route:Router, private _fb:FormBuilder,private _crudService: CrudService, private _customNotificationService:CustomNotificationService) {
  this.acadamicStatusForm = this._fb.group({
    createdBy :  ['-'] ,
   lastModifiedBy :  ['-'] ,
   academicStatus :  ['',Validators.required] ,
  });
 }

ngOnInit(): void {
  this.progStatusId = this.aciveRoute.snapshot.paramMap.get('id');
  if(this.progStatusId!="null"){
    this.action="Edit Academic Status"
    this.submit ='Update';
    this._crudService.getList('/AcademicStatuses' + '/' + this.progStatusId).subscribe((res:any)=>{
      this.patchValues(res.data);
    });
  }
  this._crudService.getList('/AcadamicProgramme').subscribe((res:any)=>{
  this.acadamicPrograms =res.data
});}
submitForm(){
 if(this.acadamicStatusForm.valid){
   if(this.progStatusId=="null") {
  this._crudService.add('/AcademicStatuses',this.acadamicStatusForm.value).subscribe((res:any)=>{
    this._customNotificationService.notification('success','Success',res.data);
    this._route.navigateByUrl('colleges/academic-status');
    
  })}
  else if(this.progStatusId!="null") {
    if(this.acadamicStatusForm.valid){
      this._crudService.update('/AcademicStatuses' ,this.progStatusId,this.acadamicStatusForm.value).subscribe((res:any)=>{
       if(res.status == 'success'){
        this._customNotificationService.notification('success','Success',res.data);
        this._route.navigateByUrl('colleges/academic-status');
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
  
  this.acadamicStatusForm.patchValue({
    academicStatus:data.academicStatus,
 })
}
}
