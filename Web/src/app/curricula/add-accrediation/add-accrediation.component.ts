import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';

@Component({
  selector: 'app-add-accrediation',
  templateUrl: './add-accrediation.component.html',
  styleUrls: ['./add-accrediation.component.scss']
})
export class AddAccrediationComponent implements OnInit {
  action = 'Add Accredition';
  acadamicProgramForm:FormGroup;
  progId:any;
  curricula:any;
  submit ='Submit';
constructor(
  public aciveRoute:ActivatedRoute,
  private _route:Router, private _fb:FormBuilder,private _crudService: CrudService, private _customNotificationService:CustomNotificationService) {
  this.acadamicProgramForm = this._fb.group({
    curriculumCode: ['',Validators.required],
    division: ['',Validators.required],
    reaccreditionSubmissionDate:[null,Validators.required],
    accreditionBeginDate:[null,Validators.required],
    accreditionEndDate:[null,Validators.required],
    createdBy: [''],
    lastModifiedBy: [''],
    remark: ['']
  });
 }

ngOnInit(): void {
  this.progId = this.aciveRoute.snapshot.paramMap.get('id');
  if(this.progId!="null"){
    this.action="Edit Accredition"
    this.submit ='Updated';
    this._crudService.getList('/CurriculumAccrediations' + '/' + this.progId).subscribe((res:any)=>{
      this.patchValues(res.data);
    });
  }
  this._crudService.getList('/Curriculums' ).subscribe((res:any)=>{
    this.curricula =res.data})
  }

submitForm(){
  if(this.progId=="null"){
 if(this.acadamicProgramForm.valid){
  this._crudService.add('/CurriculumAccrediations',this.acadamicProgramForm.value).subscribe((res:any)=>{
    this._customNotificationService.notification('success','Success','Curriculum Accrediation registered successfully.');
    this._route.navigateByUrl('curricula/accrediation');
    
  })
 }
 else{
  this._customNotificationService.notification('error','error','Enter valid data.');
 }}
 else if(this.progId!="null") {
  if(this.acadamicProgramForm.valid){
    this._crudService.update('/CurriculumAccrediations' ,this.progId,this.acadamicProgramForm.value).subscribe((res:any)=>{
     if(res.status == 'success'){
      this._customNotificationService.notification('success','Success',res.data);
      this._route.navigateByUrl('curricula/accrediation');
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
    curriculumCode:data.curriculumCode,
    division: data.division,
    reaccreditionSubmissionDate:data.reaccreditionSubmissionDate,
    accreditionBeginDate:data.accreditionBeginDate,
    accreditionEndDate:data.accreditionEndDate,
    createdBy:data.createdBy,
    lastModifiedBy: data.lastModifiedBy,
    remark:data.remark
 })
}
}
