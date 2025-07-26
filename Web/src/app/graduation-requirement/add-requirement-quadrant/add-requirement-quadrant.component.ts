import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';

@Component({
  selector: 'app-add-requirement-quadrant',
  templateUrl: './add-requirement-quadrant.component.html',
  styleUrls: ['./add-requirement-quadrant.component.scss']
})
export class AddRequirementQuadrantComponent implements OnInit {
  action = 'Add Requirement quadrant';
  requirementQuadrantForm:FormGroup;
  progId:any;
  graduationRequirements:any;
  quadrants:any;
  submit ='Submit';
constructor(
  public aciveRoute:ActivatedRoute,
  private _route:Router, private _fb:FormBuilder,private _crudService: CrudService, private _customNotificationService:CustomNotificationService) {
  this.requirementQuadrantForm = this._fb.group({
    graduationRequirementID: ['',Validators.required],
    quadrantID:['',Validators.required],
    minimumCreditHours:[0,Validators.required],
    createdBy: [''],
    lastModifiedBy: [''],
    remark: ['']
  });
 }

ngOnInit(): void {
  this.progId = this.aciveRoute.snapshot.paramMap.get('id');
  if(this.progId!="null"){
    this.action="Edit Requirement quadrant"
    this.submit = 'Update';
    this._crudService.getList('/GraduationRequirementQuadrants' + '/' + this.progId).subscribe((res:any)=>{
      this.patchValues(res.data);
    });
  }
  this._crudService.getList('/GraduationRequirements').subscribe((res:any)=>{
    this.graduationRequirements =res.data})
    this._crudService.getList('/Quadrants').subscribe((res:any)=>{
      this.quadrants =res.data})
  }

submitForm(){
  if(this.progId=="null"){
 if(this.requirementQuadrantForm.valid){
  this._crudService.add('/GraduationRequirementQuadrants',this.requirementQuadrantForm.value).subscribe((res:any)=>{
    this._customNotificationService.notification('success','Success',"Requirement quadrant saved successfully.");
    this._route.navigateByUrl('graduation/quandrant');
  })
 }
 else{
  this._customNotificationService.notification('error','error','Enter valid data.');
 }}
 else if(this.progId!="null") {
  if(this.requirementQuadrantForm.valid){
    this._crudService.update('/GraduationRequirementQuadrants' ,this.progId,this.requirementQuadrantForm.value).subscribe((res:any)=>{
     if(res.status == 'success'){
      this._customNotificationService.notification('success','Success',res.data);
      this._route.navigateByUrl('graduation/quandrant');
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
  this.requirementQuadrantForm.patchValue({

    graduationRequirementID: data.graduationRequirementID,
    quadrantID:data.quadrantID,
    minimumCreditHours:data.minimumCreditHours,
    createdBy:data.createdBy,
    lastModifiedBy: data.lastModifiedBy,
    remark:data.remark
 })
}
}
