import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';

@Component({
  selector: 'app-add-applicant-work-experience',
  templateUrl: './add-applicant-work-experience.component.html',
  styleUrls: ['./add-applicant-work-experience.component.scss']
})
export class AddApplicantWorkExperienceComponent implements OnInit {
  action = 'Add Work Experience';
  applicantExpForm:FormGroup;
  applicants:any;
  progStatusId:any;
  submit ='Submit';
constructor(
  public aciveRoute:ActivatedRoute,
  private _route:Router, private _fb:FormBuilder,private _crudService: CrudService, private _customNotificationService:CustomNotificationService) {
  this.applicantExpForm = this._fb.group({
    createdBy :  ['-'] ,
    lastModifiedBy :  ['-'] ,
    applicantID :   ['',Validators.required] ,
    companyName :   [null,Validators.required] ,
    totalWorkYear :   [0,Validators.required] ,
    post :   ["",Validators.required] ,
   
  });
 }

ngOnInit(): void {
  this.progStatusId = this.aciveRoute.snapshot.paramMap.get('id');
  if(this.progStatusId!="null"){
    this.action="Edit Applicant Work Experience"
    this.submit ='Update';
    this._crudService.getList('/ApplicantWorkExperiences' + '/' + this.progStatusId).subscribe((res:any)=>{
      this.patchValues(res.data);
    });
  }
  this._crudService.getList('/Applicants').subscribe((res:any)=>{
    
    this.applicants =res.data
  });
}
submitForm(){
 if(this.applicantExpForm.valid){
   if(this.progStatusId=="null") {
  this._crudService.add('/ApplicantWorkExperiences',this.applicantExpForm.value).subscribe((res:any)=>{
    this._customNotificationService.notification('success','Success',res.data);
    this._route.navigateByUrl('applicants/applicant-work');
    
  })}
  else if(this.progStatusId!="null") {
    if(this.applicantExpForm.valid){
      this._crudService.update('/ApplicantWorkExperiences' ,this.progStatusId,this.applicantExpForm.value).subscribe((res:any)=>{
       if(res.status == 'success'){
        this._customNotificationService.notification('success','Success',res.data);
        this._route.navigateByUrl('applicants/applicant-work');
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
  this.applicantExpForm.patchValue({
    applicantID :   data.applicantID ,
    companyName :   data.companyName ,
    totalWorkYear :   data.totalWorkYear ,
    post :  data.post ,
 })
}
}
