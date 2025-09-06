import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';

@NgModule({
  declarations: [
    // PendingPaymentListComponent is declared in BanksModule
  ],
  imports: [
    CommonModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule
  ],
  exports: [
    // No exports needed since component is declared in BanksModule
  ]
})
export class PendingPaymentListModule { } 