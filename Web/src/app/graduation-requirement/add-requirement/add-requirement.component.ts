import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';

@Component({
  selector: 'app-add-requirement',
  templateUrl: './add-requirement.component.html',
  styleUrls: ['./add-requirement.component.scss']
})
export class AddRequirementComponent implements OnInit {
  action = 'Add Graduation Requirement';
  acadamicProgramForm:FormGroup;
  progId:any;
  curricula:any;
  submit ='Submit';
constructor(
  public aciveRoute:ActivatedRoute,
  private _route:Router, private _fb:FormBuilder,private _crudService: CrudService, private _customNotificationService:CustomNotificationService) {
  this.acadamicProgramForm = this._fb.group({
    curriculumCode: ['',Validators.required],
  minimumCumlativGPA:[0,Validators.required],
  minimumMajorGPA:[0,Validators.required],
  miniTotalCreditHours:[0,Validators.required],
  passingGrade: ['',Validators.required],
    effectiveDate:[null,Validators.required],
    createdBy: [''],
    lastModifiedBy: [''],
    remark: ['']
  });
 }

ngOnInit(): void {
  this.progId = this.aciveRoute.snapshot.paramMap.get('id');
  if(this.progId!="null"){
    this.action="Edit Graduation Requirement"
    this.submit = 'Update';
    this._crudService.getList('/GraduationRequirements' + '/' + this.progId).subscribe((res:any)=>{
      this.patchValues(res.data);
    });
  }
  this._crudService.getList('/Curriculums').subscribe((res:any)=>{
    this.curricula =res.data})
  }

submitForm(){
  if(this.progId=="null"){
 if(this.acadamicProgramForm.valid){
  this._crudService.add('/GraduationRequirements',this.acadamicProgramForm.value).subscribe((res:any)=>{
    this._customNotificationService.notification('success','Success',"Graduation Requirement saved successfully.");
    this._route.navigateByUrl('graduation');
  })
 }
 else{
  this._customNotificationService.notification('error','error','Enter valid data.');
 }}
 else if(this.progId!="null") {
  if(this.acadamicProgramForm.valid){
    this._crudService.update('/GraduationRequirements' ,this.progId,this.acadamicProgramForm.value).subscribe((res:any)=>{
     if(res.status == 'success'){
      this._customNotificationService.notification('success','Success',res.data);
      this._route.navigateByUrl('graduation');
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
    minimumCumlativGPA: data.minimumCumlativGPA,
    minimumMajorGPA:data.minimumMajorGPA,
    miniTotalCreditHours:data.miniTotalCreditHours,
    passingGrade:data.passingGrade,
    effectiveDate:data.effectiveDate,
    createdBy:data.createdBy,
    lastModifiedBy: data.lastModifiedBy,
    remark:data.remark
 })
}
}
