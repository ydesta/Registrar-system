import { MenuRoutingModule } from './menu/menu-routing.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NgxPrintModule } from 'ngx-print';
import { IconsProviderModule } from '../icons-provider.module';
import { SharedModule } from '../shared-module/shared/shared.module';
import { MenuComponent } from './menu/menu.component';

@NgModule({
  declarations: [MenuComponent],
  imports: [
    CommonModule,
    MenuRoutingModule,
    FormsModule,
    IconsProviderModule,
    NzLayoutModule,
    NzMenuModule,
    SharedModule,
    NgxPrintModule,
  ],
  exports: [MenuComponent],
})
export class MainModule {}
