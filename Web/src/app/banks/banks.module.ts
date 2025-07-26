import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BanksRoutingModule } from './banks-routing.module';
import { BanksComponent } from './banks.component';
import { BankTransactionComponent } from './bank-transaction/bank-transaction.component';
import { TuitionFeeComponent } from './tuition-fee/tuition-fee.component';
import { StudentPaymentComponent } from './student-payment/student-payment.component';
import { AddStudentPaymentComponent } from './add-student-payment/add-student-payment.component';
import { AddTuitionFeeComponent } from './add-tuition-fee/add-tuition-fee.component';
import { AddBankTransactionComponent } from './add-bank-transaction/add-bank-transaction.component';
import { AddBankComponent } from './add-bank/add-bank.component';
import { SharedModule } from '../shared-module/shared/shared.module';
import { PendingPaymentListComponent } from './pending-payment-list/pending-payment-list.component';
import { PaymentModalModule } from './add-student-payment/payment-modal/payment-modal.module';
import { PaymentInstructionsComponent } from './pending-payment-list/payment-instructions/payment-instructions.component';


@NgModule({
  declarations: [
    BanksComponent,
    BankTransactionComponent,
    TuitionFeeComponent,
    StudentPaymentComponent,
    AddStudentPaymentComponent,
    AddTuitionFeeComponent,
    AddBankTransactionComponent,
    AddBankComponent,
    PendingPaymentListComponent,
    PaymentInstructionsComponent
  ],
  imports: [
    CommonModule,
    BanksRoutingModule,
    SharedModule,
    PaymentModalModule
  ]
})
export class BanksModule { }
