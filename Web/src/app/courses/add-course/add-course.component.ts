import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';

@Component({
  selector: 'app-add-course',
  templateUrl: './add-course.component.html',
  styleUrls: ['./add-course.component.scss']
})
export class AddCourseComponent implements OnInit {
  action = 'Add Course';
  acadamicProgramForm:FormGroup;
  progId:any;
  curricula:any;
  submit ='Submit';
constructor(
  public aciveRoute:ActivatedRoute,
  private _route:Router, private _fb:FormBuilder,private _crudService: CrudService, private _customNotificationService:CustomNotificationService) {
  this.acadamicProgramForm = this._fb.group({
    courseCode: ['',Validators.required],
    courseTitle: ['',Validators.required],
    creditHours:[0,Validators.required],
    lectureHours:[0,Validators.required],
    labHours:[0,Validators.required],
    createdBy: [''],
    lastModifiedBy: [''],
    remark: ['']
  });
 }

ngOnInit(): void {
  this.progId = this.aciveRoute.snapshot.paramMap.get('id');
  if(this.progId!="null"){
    this.action="Edit Course"
    this.submit = 'Update';
    this._crudService.getList( '/Courses' + '/' + this.progId ).subscribe((res:any)=>{
      this.patchValues(res.data);
    });
  }
  this._crudService.getList( '/Courses').subscribe((res:any)=>{
    this.curricula =res.data})
  }

submitForm(){
  if(this.progId=="null"){
 if(this.acadamicProgramForm.valid){
  this._crudService.add('/Courses',this.acadamicProgramForm.value).subscribe((res:any)=>{
    this._customNotificationService.notification('success','Success',res.data);
    this._route.navigateByUrl('course');
  })
 }
 else{
  this._customNotificationService.notification('error','error','Enter valid data.');
 }}
 else if(this.progId!="null") {
  if(this.acadamicProgramForm.valid){
    this._crudService.update('/Courses' ,this.progId,this.acadamicProgramForm.value).subscribe((res:any)=>{
     if(res.status == 'success'){
      this._customNotificationService.notification('success','Success',res.data);
      this._route.navigateByUrl('course');
     }
     else{
        this._customNotificationService.notification('error','Error',res.data);
       
     }
    })
   }
   else{
    this._customNotificationService.notification('error','error','Enter valid data.');
   }
 }
}
patchValues(data: any) {
  this.acadamicProgramForm.patchValue({
    courseCode:data.courseCode,
    courseTitle: data.courseTitle,
    creditHours:data.creditHours,
    lectureHours:data.lectureHours,
    labHours:data.labHours,
    createdBy:data.createdBy,
    lastModifiedBy: data.lastModifiedBy,
    remark:data.remark
 })
}
}
