import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';

@Component({
  selector: 'app-add-applicant-education-background',
  templateUrl: './add-applicant-education-background.component.html',
  styleUrls: ['./add-applicant-education-background.component.scss']
})
export class AddApplicantEducationBackgroundComponent implements OnInit {
  action = 'Add Education Background';
  educationForm:FormGroup;
  applicants:any;
  progStatusId:any;
  submit ='Submit';
constructor(
  public aciveRoute:ActivatedRoute,
  private _route:Router, private _fb:FormBuilder,private _crudService: CrudService, private _customNotificationService:CustomNotificationService) {
  this.educationForm = this._fb.group({
    createdBy :  ['-'] ,
    lastModifiedBy :  ['-'] ,
    applicantID :   ['',Validators.required] ,
    schoollName :   ['',Validators.required] ,
   fieldOfStudy :   ['',Validators.required] ,
   programmeLevel :   ["",Validators.required] ,
   graduatedYear :  [0,Validators.required],
  });
 }

ngOnInit(): void {
  this.progStatusId = this.aciveRoute.snapshot.paramMap.get('id');
  if(this.progStatusId!="null"){
    this.action="Edit Education Background"
    this.submit ='Update';
    this._crudService.getList('/ApplicantEducationBackgrounds' + '/' + this.progStatusId).subscribe((res:any)=>{
      this.patchValues(res.data);
    });
  }
  this._crudService.getList('/Applicants').subscribe((res:any)=>{
    
    this.applicants =res.data
  });
}
submitForm(){
 if(this.educationForm.valid){
   if(this.progStatusId=="null") {
  this._crudService.add('/ApplicantEducationBackgrounds',this.educationForm.value).subscribe((res:any)=>{
    this._customNotificationService.notification('success','Success',res.data);
    this._route.navigateByUrl('applicants/applicant-education');
    
  })}
  else if(this.progStatusId!="null") {
    if(this.educationForm.valid){
      this._crudService.update('/ApplicantEducationBackgrounds' ,this.progStatusId,this.educationForm.value).subscribe((res:any)=>{
       if(res.status == 'success'){
        this._customNotificationService.notification('success','Success',res.data);
        this._route.navigateByUrl('applicants/applicant-education');
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
  this.educationForm.patchValue({
    applicantID :   data.applicantID ,
    schoollName :   data.schoollName ,
   fieldOfStudy :   data.fieldOfStudy ,
   programmeLevel :  data.programmeLevel ,
   graduatedYear :  data.graduatedYear,
 })
}
}
