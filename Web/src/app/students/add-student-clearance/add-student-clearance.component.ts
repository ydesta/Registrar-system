import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';

@Component({
  selector: 'app-add-student-clearance',
  templateUrl: './add-student-clearance.component.html',
  styleUrls: ['./add-student-clearance.component.scss']
})
export class AddStudentClearanceComponent implements OnInit {

  action = 'Add Student Clearance';
  staffForm:FormGroup;
  students:any;
  progStatusId:any;
  submit ='Submit';
constructor(
  public aciveRoute:ActivatedRoute,
  private _route:Router, private _fb:FormBuilder,private _crudService: CrudService, private _customNotificationService:CustomNotificationService) {
  this.staffForm = this._fb.group({
    createdBy :  ['-'] ,
   lastModifiedBy :  ['-'] ,
    studentId :  ['',Validators.required] ,
    labraryClearance :  [false,Validators.required] ,
    financeClearance :  [false,Validators.required] ,
    systemadmin : [false,Validators.required],
    remark: ""
  });
 }

ngOnInit(): void {
  this.progStatusId = this.aciveRoute.snapshot.paramMap.get('id');
  if(this.progStatusId!="null"){
    this.action="Edit Student Clearance"
    this.submit ='Update';
    this._crudService.getList('/StudentClearances' + '/' + this.progStatusId).subscribe((res:any)=>{
      this.patchValues(res.data);
    });
  }
  this._crudService.getList('/Students').subscribe((res:any)=>{
    this.students =res.data
  });
}
submitForm(){
 if(this.staffForm.valid){
   if(this.progStatusId=="null") {
  this._crudService.add('/StudentClearances',this.staffForm.value).subscribe((res:any)=>{
    this._customNotificationService.notification('success','Success',res.data);
    this._route.navigateByUrl('students/student-clearance');
    
  })}
  else if(this.progStatusId!="null") {
    if(this.staffForm.valid){
      this._crudService.update('/StudentClearances' ,this.progStatusId,this.staffForm.value).subscribe((res:any)=>{
       if(res.status == 'success'){
        this._customNotificationService.notification('success','Success',res.data);
        this._route.navigateByUrl('students/student-clearance');
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
    studentId :  data.studentId ,
    labraryClearance :  data.labraryClearance ,
    financeClearance :  data.financeClearance ,
    systemadmin :  data.systemadmin ,
    remark : data.remark 
 })
}
}
