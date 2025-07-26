import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';

@Component({
  selector: 'app-add-student-registration',
  templateUrl: './add-student-registration.component.html',
  styleUrls: ['./add-student-registration.component.scss']
})
export class AddStudentRegistrationComponent implements OnInit {

  action = 'Add Student Registration';
  staffForm:FormGroup;
  students:any;
  courses:any;
  termCourseOfferings:any;
  progStatusId:any;
  submit ='Submit';
constructor(
  public aciveRoute:ActivatedRoute,
  private _route:Router, private _fb:FormBuilder,private _crudService: CrudService, private _customNotificationService:CustomNotificationService) {
  this.staffForm = this._fb.group({
    createdBy :  ['-'] ,
   lastModifiedBy :  ['-'] ,
   termCourseOfferingID :  ['',Validators.required] ,
   studentID :  ['',Validators.required] ,
   courseCode :  ['',Validators.required] ,
   remark :  [''] ,
    registrationDate : [null,Validators.required]
  });
 }

ngOnInit(): void {
  this.progStatusId = this.aciveRoute.snapshot.paramMap.get('id');
  if(this.progStatusId!="null"){
    this.action="Edit Student Registration"
    this.submit ='Update';
    this._crudService.getList('/StudentRegistrations' + '/' + this.progStatusId).subscribe((res:any)=>{
      this.patchValues(res.data);
    });
  }
  this._crudService.getList('/termCourseOfferings').subscribe((res:any)=>{
    
    this.termCourseOfferings =res.data
  });
  this._crudService.getList('/courses').subscribe((res:any)=>{
    
    this.courses =res.data
  });
  this._crudService.getList('/Students').subscribe((res:any)=>{
    
    this.students =res.data
  });
}
submitForm(){
  console.log(this.staffForm.value)
 if(this.staffForm.valid){
   if(this.progStatusId=="null") {
  this._crudService.add('/StudentRegistrations',this.staffForm.value).subscribe((res:any)=>{
    this._customNotificationService.notification('success','Success',res.data);
    this._route.navigateByUrl('students/student-registration');
    
  })}
  else if(this.progStatusId!="null") {
    if(this.staffForm.valid){
      this._crudService.update('/StudentRegistrations' ,this.progStatusId,this.staffForm.value).subscribe((res:any)=>{
       if(res.status == 'success'){
        this._customNotificationService.notification('success','Success',res.data);
        this._route.navigateByUrl('students/student-registration');
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
  
  this.staffForm.patchValue({
    termCourseOfferingID : data.termCourseOfferingID ,
    studentID : data.studentID ,
    courseCode : data. courseCode,
    remark : data.remark ,
     registrationDate : data.registrationDate
 
 })
}
}

