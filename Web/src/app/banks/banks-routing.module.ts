import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddBankTransactionComponent } from './add-bank-transaction/add-bank-transaction.component';
import { AddBankComponent } from './add-bank/add-bank.component';
import { AddStudentPaymentComponent } from './add-student-payment/add-student-payment.component';
import { AddTuitionFeeComponent } from './add-tuition-fee/add-tuition-fee.component';
import { BankTransactionComponent } from './bank-transaction/bank-transaction.component';
import { BanksComponent } from './banks.component';
import { StudentPaymentComponent } from './student-payment/student-payment.component';
import { TuitionFeeComponent } from './tuition-fee/tuition-fee.component';
import { PendingPaymentListComponent } from './pending-payment-list/pending-payment-list.component';

const routes: Routes = [
  { path: '', component: BanksComponent },
  { path: 'bank-transacction', component: BankTransactionComponent },
  { path: 'student-payment', component: StudentPaymentComponent },
  { path: 'tuition-fee', component: TuitionFeeComponent },
  { path: 'add-bank/:id', component: AddBankComponent },
  { path: 'add-bank-transacction/:id', component: AddBankTransactionComponent },
  { path: 'add-student-payment', component: AddStudentPaymentComponent },
  { path: 'add-tuition-fee/:id', component: AddTuitionFeeComponent },
  { path: 'pending-payment', component: PendingPaymentListComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BanksRoutingModule { }
