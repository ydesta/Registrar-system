import { Component, OnInit } from '@angular/core';
import { ApplicantModel } from 'src/app/Models/ApplicantModel';
import { BaseModel } from 'src/app/Models/BaseMode';
import { StudentModel } from 'src/app/Models/StudentModel';
import { TermCourseOfferingModel } from 'src/app/Models/TermCourseOfferingModel';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';

@Component({
  selector: 'app-course-offering',
  templateUrl: './course-offering.component.html',
  styleUrls: ['./course-offering.component.scss']
})
export class CourseOfferingComponent implements OnInit {
  termCourseOfferings:any;
  searchKey=''
  removeList:any=[]
  addList:any=[]
  constructor(
    private _crudService: CrudService, 
    private _customNotificationService:CustomNotificationService) { }

  ngOnInit(): void {
    let studentEmail = localStorage.getItem('email');
    this._crudService.getList('/Applicants/email/'+studentEmail).subscribe((appRes:BaseModel<ApplicantModel>)=>{
      this._crudService.getList('/Students/applicantId/'+appRes.data.applicantID.replace("/","%2F")).subscribe((studRes:BaseModel<StudentModel>)=>{
        this._crudService.getList( '/TermCourseOfferings/batch/' + studRes.data.batchCode).subscribe((res:BaseModel<TermCourseOfferingModel[]>)=>{
          this.termCourseOfferings =res.data
          })
        })
      })
  }
  clickSearchKey(){

  }

  addCourseList(event:any, id:any){
if(event){
  this.removeList.forEach((element:any,index:number) => {
    if(element == id){
      this.removeList.splice(index, 1);
    }
  });
  this.addList = [...this.addList,id]
}
else{
  this.addList.forEach((element:any,index:number) => {
    if(element == id){
      this.addList.splice(index, 1);
    }
  });
  this.removeList = [...this.removeList,id]
}
  }
  registerCourse(){
    if(this.addList.length==0 && this.removeList.length ==0){
      this._customNotificationService.notification('error','Error','No data selected!')
    }
    else{
      this._customNotificationService.notification('success','Success','Course registered successfully.')
    }
  }
}
