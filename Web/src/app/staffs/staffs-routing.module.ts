import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddStaffComponent } from './add-staff/add-staff.component';
import { StaffsComponent } from './staffs.component';
import { StaffProfileComponent } from './staff-profile/staff-profile.component';
import { AuthGuard } from '../guards/auth.guard';

const routes: Routes = [
  { path: '', component: StaffsComponent, canActivate: [AuthGuard] },
  { path: 'staff-profile', component: StaffProfileComponent, canActivate: [AuthGuard] },
  { path: 'add-staff/:id', component: AddStaffComponent, canActivate: [AuthGuard] }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StaffsRoutingModule { }
