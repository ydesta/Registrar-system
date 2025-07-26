import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';

@Component({
  selector: 'app-add-academic-term',
  templateUrl: './add-academic-term.component.html',
  styleUrls: ['./add-academic-term.component.scss']
})
export class AddAcademicTermComponent implements OnInit {
  action = 'Add Academic Term';
  acadamicTermForm:FormGroup;
  acadamicPrograms:any;
  progStatusId:any;
  submit ='Submit';
constructor(
  public aciveRoute:ActivatedRoute,
  private _route:Router, private _fb:FormBuilder,private _crudService: CrudService, private _customNotificationService:CustomNotificationService) {
  this.acadamicTermForm = this._fb.group({
    createdBy :  ['-'] ,
   lastModifiedBy :  ['-'] ,
   academicTermCode :  ['',Validators.required] ,
   startDate :  [null,Validators.required] ,
   endDate :  [null,Validators.required] ,
   remark :  [''] ,
  });
 }

ngOnInit(): void {
  this.progStatusId = this.aciveRoute.snapshot.paramMap.get('id');
  if(this.progStatusId!="null"){
    this.action="Edit Academic Term"
    this.submit ='Update';
    this._crudService.getList('/AcademicTerms' + '/' + this.progStatusId).subscribe((res:any)=>{
      this.patchValues(res.data);
    });
  }
  this._crudService.getList('/AcadamicProgramme').subscribe((res:any)=>{
  this.acadamicPrograms =res.data
});}
submitForm(){
 if(this.acadamicTermForm.valid){
   if(this.progStatusId=="null") {
  this._crudService.add('/AcademicTerms',this.acadamicTermForm.value).subscribe((res:any)=>{
    this._customNotificationService.notification('success','Success',res.data);
    this._route.navigateByUrl('colleges/academic-term');
    
  })}
  else if(this.progStatusId!="null") {
    if(this.acadamicTermForm.valid){
      this._crudService.update('/AcademicTerms' ,this.progStatusId,this.acadamicTermForm.value).subscribe((res:any)=>{
       if(res.status == 'success'){
        this._customNotificationService.notification('success','Success',res.data);
        this._route.navigateByUrl('colleges/academic-term');
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
  
  this.acadamicTermForm.patchValue({
    academicTermCode:data.academicTermCode,
    startDate:data.startDate,
    remark:data.remark,
    endDate: data.endDate,
 })
}
}
