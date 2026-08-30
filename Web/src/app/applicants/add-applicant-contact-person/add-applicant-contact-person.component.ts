import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { ethiopianMobileValidator, ethiopianHomePhoneValidator, normalizeEthiopianMobile, normalizeEthiopianHomePhone, applyEthiopianMobileControl, applyEthiopianHomePhoneControl } from 'src/app/common/constant';

@Component({
  selector: 'app-add-applicant-contact-person',
  templateUrl: './add-applicant-contact-person.component.html',
  styleUrls: ['./add-applicant-contact-person.component.scss']
})
export class AddApplicantContactPersonComponent implements OnInit {
  action = 'Add Applicant Contact Person';
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
    fullName :   ['',Validators.required] ,
    telephoneOffice :   ['',[Validators.required, ethiopianMobileValidator()]] ,
    telephoneHome :   ['',[ethiopianHomePhoneValidator()]] ,
    relation :   ['',Validators.required] ,
    sourceOfFinance :   ["",Validators.required] ,
    howDidYouComeKnow :   [""] ,
  
   
  });
 }

ngOnInit(): void {
  this.progStatusId = this.aciveRoute.snapshot.paramMap.get('id');
  if(this.progStatusId!="null"){
    this.action="Edit Applicant Contact Person"
    this.submit ='Update';
    this._crudService.getById('/ApplicantContactPersons', this.progStatusId).subscribe((res:any)=>{
      this.patchValues(res.data);
    });
  }
  this._crudService.getList('/Applicants').subscribe((res:any)=>{
    
    this.applicants =res.data
  });
}
submitForm(){
 if(this.applicantExpForm.valid){
   const payload = {
     ...this.applicantExpForm.value,
     telephoneOffice: normalizeEthiopianMobile(this.applicantExpForm.value.telephoneOffice) || this.applicantExpForm.value.telephoneOffice,
     telephoneHome: normalizeEthiopianHomePhone(this.applicantExpForm.value.telephoneHome) || this.applicantExpForm.value.telephoneHome || ''
   };
   if(this.progStatusId=="null") {
  this._crudService.add('/ApplicantContactPersons',payload).subscribe((res:any)=>{
    this._customNotificationService.notification('success','Success',res.data);
    this._route.navigateByUrl('applicants/applicant-contact-person');
    
  })}
  else if(this.progStatusId!="null") {
    if(this.applicantExpForm.valid){
      this._crudService.update('/ApplicantContactPersons' ,this.progStatusId,payload).subscribe((res:any)=>{
       if(res.status == 'success'){
        this._customNotificationService.notification('success','Success',res.data);
        this._route.navigateByUrl('applicants/applicant-contact-person');
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
  this.applicantExpForm.patchValue({
    applicantID :   data.applicantID ,
    fullName :   data.fullName ,
    telephoneOffice :   normalizeEthiopianMobile(data.telephoneOffice) || data.telephoneOffice ,
    telephoneHome :  normalizeEthiopianHomePhone(data.telephoneHome) || data.telephoneHome || '' ,
    relation :   data.relation ,
    totalWorkYear :   data.totalWorkYear ,
    sourceOfFinance :  data.sourceOfFinance ,
    howDidYouComeKnow : data.howDidYouComeKnow
 })
}

  onTelephoneOfficeBlur(): void {
    applyEthiopianMobileControl(this.applicantExpForm.get('telephoneOffice'));
  }

  onTelephoneHomeBlur(): void {
    applyEthiopianHomePhoneControl(this.applicantExpForm.get('telephoneHome'));
  }
}
