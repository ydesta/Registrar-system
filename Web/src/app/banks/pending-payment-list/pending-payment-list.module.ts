import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PendingPaymentListComponent } from './pending-payment-list.component';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';

@NgModule({
  declarations: [
    PendingPaymentListComponent
  ],
  imports: [
    CommonModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule
  ],
  exports: [
    PendingPaymentListComponent
  ]
})
export class PendingPaymentListModule { } 