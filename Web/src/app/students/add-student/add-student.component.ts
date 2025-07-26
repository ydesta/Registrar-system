import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';

@Component({
  selector: 'app-add-student',
  templateUrl: './add-student.component.html',
  styleUrls: ['./add-student.component.scss']
})
export class AddStudentComponent implements OnInit {
  action = 'Add Student';
  staffForm:FormGroup;
  acadamicPrograms:any;
  progStatusId:any;
  curricula:any;
  applicants:any;
  staffs:any;
  batchs:any;
  entries:any;
  submit ='Submit';
constructor(
  public aciveRoute:ActivatedRoute,
  private _route:Router, private _fb:FormBuilder,private _crudService: CrudService, private _customNotificationService:CustomNotificationService) {
  this.staffForm = this._fb.group({
   createdBy :  ['-'] ,
   lastModifiedBy :  ['-'] ,
   applicantId :  ['',Validators.required] ,
   studentId :  ['',Validators.required] ,
   curriculumCode :  ['',Validators.required] ,
   batchCode :  ['',Validators.required] ,
   entryCode :  ['',Validators.required] ,
   remark:''
  });
 }

ngOnInit(): void {
  this.progStatusId = this.aciveRoute.snapshot.paramMap.get('id');
  if(this.progStatusId!="null"){
   
    this.submit ='Update';
    this._crudService.getList('/Students' + '/' + this.progStatusId).subscribe((res:any)=>{
      this.patchValues(res.data);
    });
  }
    this._crudService.getList('/Curriculums').subscribe((res:any)=>{
      
      this.curricula =res.data
    });
    this._crudService.getList('/applicants').subscribe((res:any)=>{
      
      this.applicants =res.data
    });
    this._crudService.getList('/batchs').subscribe((res:any)=>{
      
      this.batchs =res.data
    });
    this._crudService.getList('/entrys').subscribe((res:any)=>{
      
      this.entries =res.data
    });
}
submitForm(){
 if(this.staffForm.valid){
   if(this.progStatusId=="null") {
  this._crudService.add('/Students',this.staffForm.value).subscribe((res:any)=>{
    this._customNotificationService.notification('success','Success',res.data);
    this._route.navigateByUrl('students');
    
  })}
  else if(this.progStatusId!="null") {
    if(this.staffForm.valid){
      this._crudService.update('/Students' ,this.progStatusId,this.staffForm.value).subscribe((res:any)=>{
       if(res.status == 'success'){
        this._customNotificationService.notification('success','Success',res.data);
        this._route.navigateByUrl('students');
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
    applicantId :  data.applicantId ,
    studentId :  data.studentId ,
    curriculumCode :  data.curriculumCode ,
    batchCode :  data.batchCode ,
    entryCode :  data.entryCode ,
    remark: data.remark
 
 })
}
}
