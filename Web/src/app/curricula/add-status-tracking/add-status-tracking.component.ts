import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';

@Component({
  selector: 'app-add-status-tracking',
  templateUrl: './add-status-tracking.component.html',
  styleUrls: ['./add-status-tracking.component.scss']
})
export class AddStatusTrackingComponent implements OnInit {
  action = 'Add Status Tracking';
  academicProgramForm:FormGroup;
  progId:any;
  curricula:any;
  submit ='Submit';
constructor(
  public aciveRoute:ActivatedRoute,
  private _route:Router, private _fb:FormBuilder,private _crudService: CrudService, private _customNotificationService:CustomNotificationService) {
  this.academicProgramForm = this._fb.group({
    curriculumCode: ['',Validators.required],
    status: ['',Validators.required],
    date:[null,Validators.required],
    createdBy: [''],
    lastModifiedBy: [''],
    remark: ['']
  });
 }

ngOnInit(): void {
  this.progId = this.aciveRoute.snapshot.paramMap.get('id');
  if(this.progId!="null"){
    this.action="Edit Status Tracking"
    this.submit = 'Update';
    this._crudService.getList('/CurriculumStatusTrackings' + '/' + this.progId ).subscribe((res:any)=>{
      this.patchValues(res.data);
    });
  }
  this._crudService.getList( '/Curriculums').subscribe((res:any)=>{
    this.curricula =res.data})
  }

submitForm(){
  if(this.progId=="null"){
 if(this.academicProgramForm.valid){
  this._crudService.add('/CurriculumStatusTrackings',this.academicProgramForm.value).subscribe((res:any)=>{
    this._customNotificationService.notification('success','Success','Status Tracking registered successfully.');
    this._route.navigateByUrl('curricula/status-tracking');
  })
 }
 else{
  this._customNotificationService.notification('error','error','Enter valid data.');
 }}
 else if(this.progId!="null") {
  if(this.academicProgramForm.valid){
    this._crudService.update('/CurriculumStatusTrackings' ,this.progId,this.academicProgramForm.value).subscribe((res:any)=>{
     if(res.status == 'success'){
      this._customNotificationService.notification('success','Success',res.data);
      this._route.navigateByUrl('curricula/status-tracking');
     }
     else{
        this._customNotificationService.notification('error','Error',res.data);
       
     }
    })
   }
   else{
    this._customNotificationService.notification('error','error','Enter valid data.');
   }
 }
}
patchValues(data: any) {
  this.academicProgramForm.patchValue({
    curriculumCode:data.curriculumCode,
    status: data.status,
    date:data.date,
    createdBy:data.createdBy,
    lastModifiedBy: data.lastModifiedBy,
    remark:data.remark
 })
}
}
