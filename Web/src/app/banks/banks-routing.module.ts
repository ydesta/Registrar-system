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
import { PaymentComponent } from './payment/payment.component';
import { StandalonePaymentComponent } from './components/standalone-payment.component';
import { PaymentCallbackComponent } from './payment/payment-callback/payment-callback.component';
import { PaymentOptionsComponent } from './registration/payment-options/payment-options.component';
import { RegistrationPaymentComponent } from './registration/registration-payment/registration-payment.component';
import { RegistrationSuccessComponent } from './registration/registration-success/registration-success.component';
import { AuthGuard } from '../guards/auth.guard';

const routes: Routes = [
  { path: '', component: BanksComponent, canActivate: [AuthGuard] },
  { path: 'bank-transacction', component: BankTransactionComponent, canActivate: [AuthGuard] },
  { path: 'student-payment', component: StudentPaymentComponent, canActivate: [AuthGuard] },
  { path: 'tuition-fee', component: TuitionFeeComponent, canActivate: [AuthGuard] },
  { path: 'add-bank/:id', component: AddBankComponent, canActivate: [AuthGuard] },
  { path: 'add-bank-transacction/:id', component: AddBankTransactionComponent, canActivate: [AuthGuard] },
  { path: 'add-student-payment', component: AddStudentPaymentComponent, canActivate: [AuthGuard] },
  { path: 'add-tuition-fee/:id', component: AddTuitionFeeComponent, canActivate: [AuthGuard] },
  { path: 'pending-payment', component: PendingPaymentListComponent, canActivate: [AuthGuard] },
  { path: 'payment', component: PaymentComponent, canActivate: [AuthGuard] },
  { path: 'payment/callback', component: PaymentCallbackComponent, canActivate: [AuthGuard] },
  { path: 'payment/standalone', component: StandalonePaymentComponent, canActivate: [AuthGuard] },
  { path: 'registration/payment', component: RegistrationPaymentComponent, canActivate: [AuthGuard] },
  { path: 'registration/payment-options', component: PaymentOptionsComponent, canActivate: [AuthGuard] },
  { path: 'registration/success', component: RegistrationSuccessComponent, canActivate: [AuthGuard] }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BanksRoutingModule { }
