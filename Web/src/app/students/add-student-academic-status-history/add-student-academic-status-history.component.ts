import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';

@Component({
  selector: 'app-add-student-academic-status-history',
  templateUrl: './add-student-academic-status-history.component.html',
  styleUrls: ['./add-student-academic-status-history.component.scss']
})
export class AddStudentAcademicStatusHistoryComponent implements OnInit {
 
  action = 'Add Student Course Attendance';
  staffForm:FormGroup;
  students:any;
  courses:any;
  academicStatuses:any;
  progStatusId:any;
  submit ='Submit';
constructor(
  public aciveRoute:ActivatedRoute,
  private _route:Router, private _fb:FormBuilder,private _crudService: CrudService, private _customNotificationService:CustomNotificationService) {
  this.staffForm = this._fb.group({
    createdBy :  ['-'] ,
   lastModifiedBy :  ['-'] ,
   academicStatusID :  ['',Validators.required] ,
   studentID :  ['',Validators.required] ,
   reason :  ['',Validators.required] ,
   remark :  [''] ,
   date : [null,Validators.required]
  });
 }

ngOnInit(): void {
  this.progStatusId = this.aciveRoute.snapshot.paramMap.get('id');
  if(this.progStatusId!="null"){
    this.action="Edit Student Course Attendance"
    this.submit ='Update';
    this._crudService.getList('/StudentAcademicStatusHistorys' + '/' + this.progStatusId).subscribe((res:any)=>{
      this.patchValues(res.data);
    });
  }
  this._crudService.getList('/AcademicStatuses').subscribe((res:any)=>{
    
    this.academicStatuses =res.data
  });
  this._crudService.getList('/Students').subscribe((res:any)=>{
    
    this.students =res.data
  });
}
submitForm(){
 if(this.staffForm.valid){
   if(this.progStatusId=="null") {
  this._crudService.add('/StudentAcademicStatusHistorys',this.staffForm.value).subscribe((res:any)=>{
    this._customNotificationService.notification('success','Success',res.data);
    this._route.navigateByUrl('students/student-status-history');
    
  })}
  else if(this.progStatusId!="null") {
    if(this.staffForm.valid){
      this._crudService.update('/StudentAcademicStatusHistorys' ,this.progStatusId,this.staffForm.value).subscribe((res:any)=>{
       if(res.status == 'success'){
        this._customNotificationService.notification('success','Success',res.data);
        this._route.navigateByUrl('students/student-status-history');
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
    academicStatusID : data.academicStatusID ,
    studentID : data.studentID ,
    date : data.date,
    remark : data.remark ,
    reason : data.reason
 
 })
}
}

