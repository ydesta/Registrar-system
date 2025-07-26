import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared-module/shared/shared.module';
import { RouterModule, Routes } from '@angular/router';
import {FormsModule} from '@angular/forms';
import { NgxPrintModule } from 'ngx-print';
import { SemesterRegistrationListComponent } from './semester-registration-list.component';

const routes: Routes = [{ path: '', component: SemesterRegistrationListComponent },
{path:'students/:id',component:SemesterRegistrationListComponent}

];

@NgModule({
  declarations: [
    SemesterRegistrationListComponent
  ],
  imports: [
    CommonModule,   
    SharedModule,
     FormsModule,
     NgxPrintModule
  ]
})
export class SemestersModule { }
