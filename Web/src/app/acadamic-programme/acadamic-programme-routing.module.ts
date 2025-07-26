import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AcadamicProgrammeCoordinatorComponent } from './acadamic-programme-coordinator/acadamic-programme-coordinator.component';
import { AcadamicProgrammeStatusComponent } from './acadamic-programme-status/acadamic-programme-status.component';
import { AcadamicProgrammeComponent } from './acadamic-programme.component';
import { AddAcadamicProgrammeCoordinatorComponent } from './add-acadamic-programme-coordinator/add-acadamic-programme-coordinator.component';
import { AddAcadamicProgrammeStatusComponent } from './add-acadamic-programme-status/add-acadamic-programme-status.component';
import { AddAcadamicProgrammeComponent } from './add-acadamic-programme/add-acadamic-programme.component';
import { AssignBatchComponent } from './assign-batch/assign-batch.component';
import { AuthGuard } from '../guards/auth.guard';

const routes: Routes = [
  { 
    path: '', 
    component: AcadamicProgrammeComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'add-programme/:id', 
    component: AddAcadamicProgrammeComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'programme-status', 
    component: AcadamicProgrammeStatusComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'add-programme-status/:id',
    component: AddAcadamicProgrammeStatusComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'programme-coordinator',
    component: AcadamicProgrammeCoordinatorComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'add-programme-coordinator/:id',
    component: AddAcadamicProgrammeCoordinatorComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'assign-batch', 
    component: AssignBatchComponent,
    canActivate: [AuthGuard]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AcadamicProgrammeRoutingModule {}
