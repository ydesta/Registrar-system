import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StaffsRoutingModule } from './staffs-routing.module';
import { StaffsComponent } from './staffs.component';
import { AddStaffComponent } from './add-staff/add-staff.component';
import { SharedModule } from '../shared-module/shared/shared.module';
import { StaffProfileComponent } from './staff-profile/staff-profile.component';


@NgModule({
  declarations: [
    StaffsComponent,
    AddStaffComponent,
    StaffProfileComponent
  ],
  imports: [
    CommonModule,
    StaffsRoutingModule,
    SharedModule
  ]
})
export class StaffsModule { }
