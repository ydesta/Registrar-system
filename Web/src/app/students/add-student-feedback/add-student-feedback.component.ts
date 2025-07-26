import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';

@Component({
  selector: 'app-add-student-feedback',
  templateUrl: './add-student-feedback.component.html',
  styleUrls: ['./add-student-feedback.component.scss']
})
export class AddStudentFeedbackComponent implements OnInit {

  
  action = 'Add Feedback';
  feedbackForm:FormGroup;
  acadamicPrograms:any;
  progStatusId:any;
  submit ='Submit';
constructor(
  public aciveRoute:ActivatedRoute,
  private _route:Router, private _fb:FormBuilder,private _crudService: CrudService, private _customNotificationService:CustomNotificationService) {
  this.feedbackForm = this._fb.group({
    createdBy :  ['-'] ,
   lastModifiedBy :  ['-'] ,
   comments :  ['',Validators.required] ,
    remark :  [''] ,
    date : [null,Validators.required]
  });
 }

ngOnInit(): void {
  this.progStatusId = this.aciveRoute.snapshot.paramMap.get('id');
  if(this.progStatusId!="null"){
    this.action="Edit Feedback"
    this.submit ='Update';
    this._crudService.getList('/StudentFeedbacks' + '/' + this.progStatusId).subscribe((res:any)=>{
      this.patchValues(res.data);
    });
  }
}
submitForm(){
 if(this.feedbackForm.valid){
   if(this.progStatusId=="null") {
  this._crudService.add('/StudentFeedbacks',this.feedbackForm.value).subscribe((res:any)=>{
    this._customNotificationService.notification('success','Success',res.data);
    this._route.navigateByUrl('students/student-feedback');
    
  })}
  else if(this.progStatusId!="null") {
    if(this.feedbackForm.valid){
      this._crudService.update('/StudentFeedbacks' ,this.progStatusId,this.feedbackForm.value).subscribe((res:any)=>{
       if(res.status == 'success'){
        this._customNotificationService.notification('success','Success',res.data);
        this._route.navigateByUrl('students/student-feedback');
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
  
  this.feedbackForm.patchValue({
    comments :  data.comments ,
    remark :  data.remark ,
    date : data.date
 
 })
}
}
