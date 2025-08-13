import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { NzModalService } from 'ng-zorro-antd/modal';
import { BaseModel } from 'src/app/Models/BaseMode';
import { StudentCreateModel } from 'src/app/Models/StudentCreateModel';
import { StudentModel } from 'src/app/Models/StudentModel';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-assign-batch',
  templateUrl: './assign-batch.component.html',
  styleUrls: ['./assign-batch.component.scss']
})
export class AssignBatchComponent implements OnInit {
  students?:StudentModel[];
  reqId = '';
  checked = false;
  fileUrl = environment.fileUrl;
  applicantIdList:any=[]
  assignEnable=true;
  isAssignModalVisible = false;
  isAssignModalOkLoading = false;
  studentList:StudentCreateModel[]=[]
  curricula:any;
  staffs:any;
  batches:any;
  entries:any;
  assignBatchForm:FormGroup;
 
    constructor(
       private _fb: FormBuilder,
       private _customNotificationService:CustomNotificationService,
      private _crudService: CrudService,
      private modal: NzModalService
      ) { 
        this.assignBatchForm = this._fb.group({
          createdBy :  ['-'] ,
          lastModifiedBy :  ['-'] ,
          applicantId :  ['',Validators.required] ,
          studentId :  ['',Validators.required] ,
          curriculumCode :  ['',Validators.required] ,
          batchCode :  ['',Validators.required] ,
          entryCode :  ['',Validators.required] ,
          remark:''
         });
      }
  
    ngOnInit(): void {

     this.fetchProgram();
     this._crudService.getList('/Curriculums').subscribe((res:any)=>{
      
      this.curricula =res.data
    });
    this._crudService.getList('/batchs').subscribe((res:any)=>{
      
      this.batches =res.data
    });
    this._crudService.getList('/entrys').subscribe((res:any)=>{
      
      this.entries =res.data
    });
    }
    
    fetchProgram(){
      this._crudService.getList( '/ApplicantHistorys').subscribe((res:BaseModel<StudentModel[]>)=>{
        this.students =res.data
        })
    }
    AddApplicantToList(event:any,applicantId:string){
    
      if(event){
        this.applicantIdList=[...this.applicantIdList,applicantId]
        if(this.applicantIdList.length>0){
        this.assignEnable = false;
        }
      }
      else{
        this.applicantIdList.forEach((element:any,index :number) => {
          if(element==applicantId){
            this.applicantIdList.splice(index, 1);
          }
        });
        if(this.applicantIdList.length<=0){
          this.assignEnable = true;
          }
      }
    }
    showAssignModal(){
  this.isAssignModalVisible =true;
    }
    showDeleteConfirm(id:any): void {
      this.reqId = id;
      this.modal.confirm({
        nzTitle: 'Are you sure delete this Student?',
        // nzContent: '<b style="color: red;">Some descriptions</b>',
        nzOkText: 'Yes',
        nzOkType: 'primary',
        nzOkDanger: true,
        nzOnOk: () => {
             this._crudService.delete('/Students', this.reqId).subscribe((res:any)=>{
              
              this.fetchProgram();
              if(res.status ==  "success" ){
          this._customNotificationService.notification('success','Success',res.data)
              }
              if(res.status ==  "error" ){
                this._customNotificationService.notification('error','Error',res.data)
                    }
             })
        },
        nzCancelText: 'No',
        nzOnCancel: () => console.log('Cancel')
      });
    }
    exportStudents(){
      this._crudService.getList( '/Students/excel').subscribe((res:any)=>{

        if(res.data.toString() == "No data found"){
          this._customNotificationService.notification('error','Error',res.data)
        }
        else{
          let fileLists = res.data.split('/');
          this._crudService.expoerExcel( '/' + res.data).subscribe((data:any)=>{          
            let downloadURL = window.URL.createObjectURL(data);
            let link = document.createElement('a');
            link.href = downloadURL;
            link.download = fileLists[fileLists.length - 1];
            link.click();
            this._customNotificationService.notification('success','Success',"Excel file is downloaded succesfully.")
        })
        }
        });
    }
    submitAssignBatchForm(){
      this.isAssignModalOkLoading = true;
      this.applicantIdList.forEach((appID:any) => {
        this.studentList =[...this.studentList,{
          createdBy :  '-' ,
          lastModifiedBy :  '-' ,
          applicantId :  appID,
          studentId :  '',
          curriculumCode :  this.assignBatchForm.value.curriculumCode,
          batchCode :  this.assignBatchForm.value.batchCode,
          entryCode :  this.assignBatchForm.value.entryCode,
          remark:this.assignBatchForm.value.remark
        }]
      });
      if(this.studentList.length>0) {
        this._crudService.add('/Students',this.studentList).subscribe((res:any)=>{
          
          if(res.status = "success"){
            this._customNotificationService.notification('success','Success',res.data);
            this.isAssignModalVisible = false;
          }
          else{
            this._customNotificationService.notification('error','Error',res.data);
          }
          this.isAssignModalOkLoading = false;
        })}
    }
    handleOk(): void {
      this.isAssignModalOkLoading = true;
      setTimeout(() => {
        this.isAssignModalVisible = false;
        this.isAssignModalOkLoading = false;
      }, 3000);
    }
  
    handleCancel(): void {
      this.isAssignModalVisible = false;
    }
  }
  