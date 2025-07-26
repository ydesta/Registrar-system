import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';

@Component({
  selector: 'app-add-tuition-fee',
  templateUrl: './add-tuition-fee.component.html',
  styleUrls: ['./add-tuition-fee.component.scss']
})
export class AddTuitionFeeComponent implements OnInit {
  action = 'Add Tuition Fee';
  tuitionFeeForm:FormGroup;
  acadamicProgrammes:any;
  entries:any;
  progStatusId:any;
  submit ='Submit';
constructor(
  public aciveRoute:ActivatedRoute,
  private _route:Router, private _fb:FormBuilder,private _crudService: CrudService, private _customNotificationService:CustomNotificationService) {
  this.tuitionFeeForm = this._fb.group({
    createdBy :  ['-'] ,
    lastModifiedBy :  ['-'] ,
    entryCode :   ['',Validators.required],
    acadamicProgrammeCode :   ['',Validators.required] ,
    entryYear :  [0,Validators.required],
     remark :   [''] ,
     feePerCredit :  [0,Validators.required]
  });
 }

ngOnInit(): void {
  this.progStatusId = this.aciveRoute.snapshot.paramMap.get('id');
  if(this.progStatusId!="null"){
    this.action="Edit Tuition Fee"
    this.submit ='Update';
    this._crudService.getList('/TuitionFees' + '/' + this.progStatusId).subscribe((res:any)=>{
      this.patchValues(res.data);
    });
  }
  this._crudService.getList('/AcadamicProgramme').subscribe((res:any)=>{
    
    this.acadamicProgrammes =res.data
  });
  this._crudService.getList('/Entrys').subscribe((res:any)=>{
    
    this.entries =res.data
  });
}
submitForm(){
 if(this.tuitionFeeForm.valid){
   if(this.progStatusId=="null") {
  this._crudService.add('/TuitionFees',this.tuitionFeeForm.value).subscribe((res:any)=>{
    this._customNotificationService.notification('success','Success',res.data);
    this._route.navigateByUrl('banks/tuition-fee');
    
  })}
  else if(this.progStatusId!="null") {
    if(this.tuitionFeeForm.valid){
      this._crudService.update('/TuitionFees' ,this.progStatusId,this.tuitionFeeForm.value).subscribe((res:any)=>{
       if(res.status == 'success'){
        this._customNotificationService.notification('success','Success',res.data);
        this._route.navigateByUrl('banks/tuition-fee');
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
  
  this.tuitionFeeForm.patchValue({
    entryCode :  data.entryCode,
    acadamicProgrammeCode :   data.acadamicProgrammeCode ,
    entryYear :  data.entryYear,
     remark :  data.remark ,
     feePerCredit : data.feePerCredit
 })
}
}
