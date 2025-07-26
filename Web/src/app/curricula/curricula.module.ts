import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { CurriculaRoutingModule } from "./curricula-routing.module";
import { CurriculaComponent } from "./curricula.component";
import { StatusTrackingComponent } from "./status-tracking/status-tracking.component";
import { AccrediationComponent } from "./accrediation/accrediation.component";
import { SharedModule } from "../shared-module/shared/shared.module";
import { AddCurriculumComponent } from "./add-curriculum/add-curriculum.component";
import { AddStatusTrackingComponent } from "./add-status-tracking/add-status-tracking.component";
import { AddAccrediationComponent } from "./add-accrediation/add-accrediation.component";
import { NgxPrintModule } from "ngx-print";
import { ManageQuadrantBreakdownComponent } from "./quadrant-breakdown/manage-quadrant-breakdown/manage-quadrant-breakdown.component";
import { QuadrantBreakdownFormComponent } from "./quadrant-breakdown/quadrant-breakdown-form/quadrant-breakdown-form.component";
import { CourseDetailsComponent } from "./quadrant-breakdown/manage-quadrant-breakdown/course-details/course-details.component";
import { ManageCurriculumBreakdownComponent } from './curriculum-breakdown/manage-curriculum-breakdown/manage-curriculum-breakdown.component';
import { CurriculumBreakdownFormComponent } from './curriculum-breakdown/curriculum-breakdown-form/curriculum-breakdown-form.component';
import { CurriculumCourseBreakdownListComponent } from './curriculum-breakdown/curriculm-course-breakdown-list/curriculm-course-breakdown-list.component';
import { CurriculumStatusTrackingListComponent } from './curriculum-status-tracking-list/curriculum-status-tracking-list.component';
import { DataMigrationComponent } from './data-migration/data-migration.component';
import { NzIconModule } from "ng-zorro-antd/icon";

@NgModule({
  declarations: [
    CurriculaComponent,
    StatusTrackingComponent,
    AccrediationComponent,
    AddCurriculumComponent,
    AddStatusTrackingComponent,
    AddAccrediationComponent,
    ManageQuadrantBreakdownComponent,
    QuadrantBreakdownFormComponent,
    CourseDetailsComponent,
    ManageCurriculumBreakdownComponent,
    CurriculumBreakdownFormComponent,
    CurriculumCourseBreakdownListComponent,
    CurriculumStatusTrackingListComponent,
    DataMigrationComponent,
    
  ],
  imports: [CommonModule, CurriculaRoutingModule, SharedModule, NzIconModule, NgxPrintModule]
})
export class CurriculaModule {}
