import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CrudService } from 'src/app/services/crud.service';
import { CustomNotificationService } from 'src/app/services/custom-notification.service';

@Component({
  selector: 'app-add-bank-transaction',
  templateUrl: './add-bank-transaction.component.html',
  styleUrls: ['./add-bank-transaction.component.scss']
})
export class AddBankTransactionComponent implements OnInit {
  action = 'Add Bank Transaction';
  bankTransactionForm:FormGroup;
  banks:any;
  progStatusId:any;
  submit ='Submit';
constructor(
  public aciveRoute:ActivatedRoute,
  private _route:Router, private _fb:FormBuilder,private _crudService: CrudService, private _customNotificationService:CustomNotificationService) {
  this.bankTransactionForm = this._fb.group({
    createdBy :  ['-'] ,
    lastModifiedBy :  ['-'] ,
     bankID :   ['',Validators.required],
     transactionID :   ['',Validators.required] ,
     paymentDate :   [null,Validators.required] ,
     amount :  [0,Validators.required]
  });
 }

ngOnInit(): void {
  this.progStatusId = this.aciveRoute.snapshot.paramMap.get('id');
  if(this.progStatusId!="null"){
    this.action="Edit Transaction"
    this.submit ='Update';
    this._crudService.getList('/BankTransactions' + '/' + this.progStatusId).subscribe((res:any)=>{
      this.patchValues(res.data);
    });
  }
  this._crudService.getList('/Banks').subscribe((res:any)=>{
    this.banks=res.data;
  });
}
submitForm(){
 if(this.bankTransactionForm.valid){
   if(this.progStatusId=="null") {
  this._crudService.add('/BankTransactions',this.bankTransactionForm.value).subscribe((res:any)=>{
    this._customNotificationService.notification('success','Success',res.data);
    this._route.navigateByUrl('banks/bank-transacction');
    
  })}
  else if(this.progStatusId!="null") {
    if(this.bankTransactionForm.valid){
      this._crudService.update('/BankTransactions' ,this.progStatusId,this.bankTransactionForm.value).subscribe((res:any)=>{
       if(res.status == 'success'){
        this._customNotificationService.notification('success','Success',res.data);
        this._route.navigateByUrl('banks/bank-transacction');
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
  
  this.bankTransactionForm.patchValue({
    bankID :   data.bankID,
    transactionID :   data.transactionID ,
    paymentDate :   data.paymentDate ,
    amount :  data.amount
 })
}
}
