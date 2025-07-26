import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AcadamicProgrammeRoutingModule } from './acadamic-programme-routing.module';
import { AcadamicProgrammeComponent } from './acadamic-programme.component';
import { SharedModule } from '../shared-module/shared/shared.module';
import { AddAcadamicProgrammeComponent } from './add-acadamic-programme/add-acadamic-programme.component';
import { CustomNotificationService } from '../services/custom-notification.service';
import { AcadamicProgrammeStatusComponent } from './acadamic-programme-status/acadamic-programme-status.component';
import { AddAcadamicProgrammeStatusComponent } from './add-acadamic-programme-status/add-acadamic-programme-status.component';
import { AddAcadamicProgrammeCoordinatorComponent } from './add-acadamic-programme-coordinator/add-acadamic-programme-coordinator.component';
import { AcadamicProgrammeCoordinatorComponent } from './acadamic-programme-coordinator/acadamic-programme-coordinator.component';
import { NgxPrintModule } from 'ngx-print';
import { AssignBatchComponent } from './assign-batch/assign-batch.component';

@NgModule({
  declarations: [
    AcadamicProgrammeComponent,
    AddAcadamicProgrammeComponent,
    AcadamicProgrammeStatusComponent,
    AddAcadamicProgrammeStatusComponent,
    AddAcadamicProgrammeCoordinatorComponent,
    AcadamicProgrammeCoordinatorComponent,
    AssignBatchComponent,
  ],
  imports: [
    CommonModule,
    AcadamicProgrammeRoutingModule,
    SharedModule,
    NgxPrintModule,
  ],
  providers: [CustomNotificationService],
})
export class AcadamicProgrammeModule {}
