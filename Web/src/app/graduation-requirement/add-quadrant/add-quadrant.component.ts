import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';

@Component({
  selector: 'app-add-quadrant',
  templateUrl: './add-quadrant.component.html',
  styleUrls: ['./add-quadrant.component.scss']
})
export class AddQuadrantComponent implements OnInit {

  action = 'Add Quadrant';
  acadamicProgramForm:FormGroup;
  progId:any;
  curricula:any;
  submit ='Submit';
constructor(
  public aciveRoute:ActivatedRoute,
  private _route:Router, private _fb:FormBuilder,private _crudService: CrudService, private _customNotificationService:CustomNotificationService) {
  this.acadamicProgramForm = this._fb.group({
    quadrantsID: ['',Validators.required],
    quadrantHeading:["",Validators.required],
    createdBy: [''],
    lastModifiedBy: [''],
    remark: ['']
  });
 }

ngOnInit(): void {
  this.progId = this.aciveRoute.snapshot.paramMap.get('id');
  if(this.progId!="null"){
    this.action="Edit Quadrant"
    this.submit = 'Update';
    this._crudService.getList('/Quadrants' + '/' + this.progId).subscribe((res:any)=>{
      this.patchValues(res.data);
    });
  }
}
submitForm(){
  if(this.progId=="null"){
 if(this.acadamicProgramForm.valid){
  this._crudService.add('/Quadrants',this.acadamicProgramForm.value).subscribe((res:any)=>{
    this._customNotificationService.notification('success','Success',"Quadrant saved successfully.");
    this._route.navigateByUrl('graduation/quadrant');
  })
 }
 else{
  this._customNotificationService.notification('error','error','Enter valid data.');
 }}
 else if(this.progId!="null") {
  if(this.acadamicProgramForm.valid){
    this._crudService.update('/Quadrants' ,this.progId,this.acadamicProgramForm.value).subscribe((res:any)=>{
     if(res.status == 'success'){
      this._customNotificationService.notification('success','Success',res.data);
      this._route.navigateByUrl('graduation/quadrant');
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

    quadrantsID: data.quadrantsID,
    quadrantHeading:data.quadrantHeading,
    createdBy:data.createdBy,
    lastModifiedBy: data.lastModifiedBy,
    remark:data.remark
 })
}
}
