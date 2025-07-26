import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';

@Component({
  selector: 'app-add-student-entry-trucking',
  templateUrl: './add-student-entry-trucking.component.html',
  styleUrls: ['./add-student-entry-trucking.component.scss']
})
export class AddStudentEntryTruckingComponent implements OnInit {

  action = 'Add Student Course Attendance';
  staffForm:FormGroup;
  students:any;
  entries:any;
  progStatusId:any;
  submit ='Submit';
constructor(
  public aciveRoute:ActivatedRoute,
  private _route:Router, private _fb:FormBuilder,private _crudService: CrudService, private _customNotificationService:CustomNotificationService) {
  this.staffForm = this._fb.group({
    createdBy :  ['-'] ,
   lastModifiedBy :  ['-'] ,
   studentID :  ['',Validators.required] ,
   entryCode :  ['',Validators.required] ,
   remark :  [''] ,
   assignedDate : [null,Validators.required]

  });
 }

ngOnInit(): void {
  this.progStatusId = this.aciveRoute.snapshot.paramMap.get('id');
  if(this.progStatusId!="null"){
    this.action="Edit Student Entry Trucking"
    this.submit ='Update';
    this._crudService.getList('/StudentEntryTruckings' + '/' + this.progStatusId).subscribe((res:any)=>{
      this.patchValues(res.data);
    });
  }

  this._crudService.getList('/Entrys').subscribe((res:any)=>{
    
    this.entries =res.data
  });
  this._crudService.getList('/Students').subscribe((res:any)=>{
    
    this.students =res.data
  });
}
submitForm(){
 if(this.staffForm.valid){
   if(this.progStatusId=="null") {
  this._crudService.add('/StudentEntryTruckings',this.staffForm.value).subscribe((res:any)=>{
    this._customNotificationService.notification('success','Success',res.data);
    this._route.navigateByUrl('students/entry-trucking');
    
  })}
  else if(this.progStatusId!="null") {
    if(this.staffForm.valid){
      this._crudService.update('/StudentEntryTruckings' ,this.progStatusId,this.staffForm.value).subscribe((res:any)=>{
       if(res.status == 'success'){
        this._customNotificationService.notification('success','Success',res.data);
        this._route.navigateByUrl('students/entry-trucking');
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
    studentID : data.studentID ,
    entryCode : data. entryCode,
    remark : data.remark ,
    assignedDate : data.assignedDate
    
 })
}
}

