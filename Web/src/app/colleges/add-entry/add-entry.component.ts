import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';

@Component({
  selector: 'app-add-entry',
  templateUrl: './add-entry.component.html',
  styleUrls: ['./add-entry.component.scss']
})
export class AddEntryComponent implements OnInit {

  action = 'Add Entry';
  entryForm:FormGroup;
  acadamicPrograms:any;
  progStatusId:any;
  submit ='Submit';
constructor(
  public aciveRoute:ActivatedRoute,
  private _route:Router, private _fb:FormBuilder,private _crudService: CrudService, private _customNotificationService:CustomNotificationService) {
  this.entryForm = this._fb.group({
    createdBy :  ['-'] ,
   lastModifiedBy :  ['-'] ,
   entryCode :  ['',Validators.required] ,
   entryTerm :  ['',Validators.required] ,
   remark :  [''] ,
  });
 }

ngOnInit(): void {
  this.progStatusId = this.aciveRoute.snapshot.paramMap.get('id');
  if(this.progStatusId!="null"){
    this.action="Edit Entry"
    this.submit ='Update';
    this._crudService.getList('/Entrys' + '/' + this.progStatusId).subscribe((res:any)=>{
      this.patchValues(res.data);
    });
  }
  this._crudService.getList('/AcadamicProgramme').subscribe((res:any)=>{
  this.acadamicPrograms =res.data
});}
submitForm(){
 if(this.entryForm.valid){
   if(this.progStatusId=="null") {
  this._crudService.add('/Entrys',this.entryForm.value).subscribe((res:any)=>{
    this._customNotificationService.notification('success','Success',res.data);
    this._route.navigateByUrl('colleges/entry');
    
  })}
  else if(this.progStatusId!="null") {
    if(this.entryForm.valid){
      this._crudService.update('/Entrys' ,this.progStatusId,this.entryForm.value).subscribe((res:any)=>{
       if(res.status == 'success'){
        this._customNotificationService.notification('success','Success',res.data);
        this._route.navigateByUrl('colleges/entry');
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
  
  this.entryForm.patchValue({
    entryCode:data.entryCode,
    entryTerm:data.entryTerm,
    remark:data.remark,
 })
}
}
