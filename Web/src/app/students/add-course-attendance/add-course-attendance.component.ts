import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';

@Component({
  selector: 'app-add-course-attendance',
  templateUrl: './add-course-attendance.component.html',
  styleUrls: ['./add-course-attendance.component.scss']
})
export class AddCourseAttendanceComponent implements OnInit {

  action = 'Add Student Course Attendance';
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
   termOfferingID :  ['',Validators.required] ,
   studentID :  ['',Validators.required] ,
   courseCode :  ['',Validators.required] ,
   remark :  [''] ,
   noOfDaysPresent : [0,Validators.required]
  });
 }

ngOnInit(): void {
  this.progStatusId = this.aciveRoute.snapshot.paramMap.get('id');
  if(this.progStatusId!="null"){
    this.action="Edit Student Course Attendance"
    this.submit ='Update';
    this._crudService.getList('/StudentCourseAttendances' + '/' + this.progStatusId).subscribe((res:any)=>{
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
 if(this.staffForm.valid){
   if(this.progStatusId=="null") {
  this._crudService.add('/StudentCourseAttendances',this.staffForm.value).subscribe((res:any)=>{
    this._customNotificationService.notification('success','Success',res.data);
    this._route.navigateByUrl('students/student-attendance');
    
  })}
  else if(this.progStatusId!="null") {
    if(this.staffForm.valid){
      this._crudService.update('/StudentCourseAttendances' ,this.progStatusId,this.staffForm.value).subscribe((res:any)=>{
       if(res.status == 'success'){
        this._customNotificationService.notification('success','Success',res.data);
        this._route.navigateByUrl('students/student-attendance');
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
    termOfferingID : data.termOfferingID ,
    studentID : data.studentID ,
    courseCode : data. courseCode,
    remark : data.remark ,
    noOfDaysPresent : data.noOfDaysPresent
 
 })
}
}

