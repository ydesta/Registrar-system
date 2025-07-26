import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddStaffComponent } from './add-staff/add-staff.component';
import { StaffsComponent } from './staffs.component';
import { StaffProfileComponent } from './staff-profile/staff-profile.component';

const routes: Routes = [
  { path: '', component: StaffsComponent },
  { path: 'staff-profile', component: StaffProfileComponent },
  { path: 'add-staff/:id', component: AddStaffComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StaffsRoutingModule { }
